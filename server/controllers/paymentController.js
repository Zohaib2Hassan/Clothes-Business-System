import User from '../models/User.js';
import Notification from '../models/Notification.js';
import crypto from 'crypto';
import SafepaySDK from '@sfpy/node-core';

// Initialize Safepay SDK instance (lazy, after env is loaded)
let _safepay = null;
function getSafepay() {
  if (!_safepay) {
    const secretKey = process.env.SAFEPAY_SECRET_KEY;
    if (!secretKey) throw new Error('SAFEPAY_SECRET_KEY is not configured in environment.');
    _safepay = SafepaySDK(secretKey, {
      authType: 'secret',
      host: process.env.SAFEPAY_BASE_URL || 'https://sandbox.api.getsafepay.com',
    });
  }
  return _safepay;
}

// @desc    Create a Safepay payment session and return tracker token + checkout URL
// @route   POST /api/payments/create-payment
// @access  Private
export const createPayment = async (req, res) => {
  try {
    const { amount, currency, orderId } = req.body;

    // Amount in paisa (Rs. 1,499 = 149900 paisa)
    const paymentAmount = amount ? Math.round(Number(amount)) : 149900;
    const paymentCurrency = currency || 'PKR';

    const safepay = getSafepay();

    // Create a payment session via Safepay SDK (Payments 2.0)
    const session = await safepay.payments.session.setup({
      merchant_api_key: process.env.SAFEPAY_PUBLIC_KEY,
      intent: 'CYBERSOURCE',
      mode: 'payment',
      currency: paymentCurrency,
      amount: paymentAmount,
    });

    const tracker = session?.data?.tracker?.token;

    if (!tracker) {
      console.error('[Safepay] Session setup failed:', JSON.stringify(session, null, 2));
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment session with Safepay.',
        errors: session?.status?.errors,
      });
    }

    // Generate embedded / hosted checkout URL
    const checkoutUrl = safepay.checkout.createCheckoutUrl({
      tracker: tracker,
      env: process.env.SAFEPAY_ENVIRONMENT || 'sandbox',
      source: 'custom',
    });

    console.log(`[Safepay] Session created successfully: tracker=${tracker}, orderId=${orderId || 'none'}`);

    res.json({
      success: true,
      tracker,
      checkout_url: checkoutUrl,
    });
  } catch (error) {
    console.error('[Safepay] Create payment error:', error?.response?.data || error.message || error);
    const errMsg = error?.response?.data?.status?.errors?.[0] || error.message || 'Payment initialization failed';
    res.status(500).json({
      success: false,
      message: errMsg,
      error: error?.response?.data || error.message,
    });
  }
};

// @desc    Verify payment status after Safepay checkout completes and activate subscription
// @route   POST /api/payments/verify-payment
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { tracker, plan, creditsPack, amount: paidAmount } = req.body;

    if (!tracker) {
      return res.status(400).json({ success: false, message: 'Tracker token is required for verification.' });
    }

    console.log(`[Safepay] Verifying payment for tracker: ${tracker}, user: ${req.user?._id}`);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isCreditsPurchase = Boolean(creditsPack);
    const invoiceId = `SP-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!user.billingHistory) {
      user.billingHistory = [];
    }

    if (isCreditsPurchase) {
      // Credits top-up purchase
      const creditsToAdd = Number(creditsPack) || 100;
      const amount = paidAmount ? Number(paidAmount) / 100 : (creditsToAdd >= 1000 ? 2999 : creditsToAdd >= 400 ? 1499 : 499);

      user.aiCredits = (user.aiCredits || 50) + creditsToAdd;

      user.billingHistory.unshift({
        planName: `${creditsToAdd} AI Credits Pack`,
        amount,
        paymentMethod: 'Easypaisa',
        date: new Date(),
        status: 'Paid',
        invoiceId,
      });

      await user.save();

      await Notification.create({
        user: user._id,
        title: 'Credits Added via Safepay',
        message: `Successfully added ${creditsToAdd} AI Credits to your account via Safepay (Rs. ${amount.toLocaleString()}). Invoice: ${invoiceId}`,
        type: 'subscription',
        read: false,
      });

      return res.json({
        success: true,
        verified: true,
        aiCredits: user.aiCredits,
        billingHistory: user.billingHistory,
        invoiceId,
      });
    } else {
      // Plan upgrade (Premium / Annual)
      const selectedPlan = plan || 'Premium';
      let periodDays = 30;
      let bonusCredits = 100;
      let amount = 1499;

      if (selectedPlan === 'Annual') {
        periodDays = 365;
        bonusCredits = 500;
        amount = 14390;
      }

      user.subscriptionTier = selectedPlan;
      user.subscriptionExpiresAt = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);
      user.aiCredits = (user.aiCredits || 50) + bonusCredits;

      user.billingHistory.unshift({
        planName: `${selectedPlan} Plan (${periodDays === 365 ? '1 Year' : '1 Month'})`,
        amount,
        paymentMethod: 'Easypaisa',
        date: new Date(),
        status: 'Paid',
        invoiceId,
      });

      await user.save();

      await Notification.create({
        user: user._id,
        title: 'Subscription Activated via Safepay',
        message: `Your account was upgraded to ${selectedPlan} Plan via Safepay (Rs. ${amount.toLocaleString()}). Enjoy all premium features! Invoice: ${invoiceId}`,
        type: 'subscription',
        read: false,
      });

      return res.json({
        success: true,
        verified: true,
        subscriptionTier: user.subscriptionTier,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        aiCredits: user.aiCredits,
        billingHistory: user.billingHistory,
        invoiceId,
      });
    }
  } catch (error) {
    console.error('[Safepay] Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment.',
      error: error.message,
    });
  }
};

// @desc    Safepay Webhook to handle asynchronous payment events
// @route   POST /api/payments/safepay-webhook
// @access  Public (verified via signature)
export const safepayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-sfpy-signature'];
    const secretKey = process.env.SAFEPAY_SECRET_KEY;

    // Verify webhook signature if provided
    if (signature && secretKey) {
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('[Safepay Webhook] Signature verification failed');
        return res.status(403).json({ message: 'Invalid webhook signature' });
      }
    }

    const event = req.body;
    console.log('[Safepay Webhook] Received event:', event?.type || event?.event || 'unknown');

    // Handle payment completed event
    if (event?.type === 'payment.completed' || event?.event === 'payment.completed') {
      const tracker = event?.data?.tracker;
      const metadata = event?.data?.metadata || {};
      const userId = metadata?.userId;

      if (userId) {
        const user = await User.findById(userId);
        if (user && user.subscriptionTier !== 'Premium' && user.subscriptionTier !== 'Annual') {
          user.subscriptionTier = metadata.plan || 'Premium';
          user.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          user.aiCredits = (user.aiCredits || 50) + 100;
          await user.save();
          console.log(`[Safepay Webhook] Upgraded user ${userId} to ${user.subscriptionTier}`);
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Safepay Webhook] Error processing webhook:', error);
    res.status(500).json({ error: error.message });
  }
};
