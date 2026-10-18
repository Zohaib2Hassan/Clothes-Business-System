import User from '../models/User.js';
import Notification from '../models/Notification.js';

// @desc    Get current subscription details & billing history
// @route   GET /api/subscription
// @access  Private
export const getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('subscriptionTier subscriptionExpiresAt aiCredits billingHistory name email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      subscriptionTier: user.subscriptionTier || 'Free',
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      aiCredits: user.aiCredits !== undefined ? user.aiCredits : 50,
      billingHistory: user.billingHistory || [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upgrade or change subscription plan
// @route   POST /api/subscription/upgrade
// @access  Private
export const upgradeSubscription = async (req, res) => {
  try {
    const { plan, paymentMethod, phoneNumber } = req.body;

    if (!plan || !['Premium', 'Annual', 'Free'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid subscription plan selected' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (plan === 'Free') {
      user.subscriptionTier = 'Free';
      user.subscriptionExpiresAt = null;
      await user.save();

      await Notification.create({
        user: user._id,
        title: 'Plan Changed to Free',
        message: 'Your subscription has been changed to the Free plan.',
        type: 'system',
        link: '/subscription',
        isRead: false,
      });

      return res.json({
        subscriptionTier: user.subscriptionTier,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        aiCredits: user.aiCredits || 50,
        billingHistory: user.billingHistory || [],
      });
    }

    let amount = 1499;
    let periodDays = 30;
    let bonusCredits = 100;

    if (plan === 'Annual') {
      amount = 14390;
      periodDays = 365;
      bonusCredits = 500;
    }

    user.subscriptionTier = plan;
    user.subscriptionExpiresAt = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);
    user.aiCredits = (user.aiCredits || 50) + bonusCredits;

    const invoiceId = `INV-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!user.billingHistory) {
      user.billingHistory = [];
    }

    user.billingHistory.unshift({
      planName: `${plan} Plan (${periodDays === 365 ? '1 Year' : '1 Month'})`,
      amount,
      paymentMethod: paymentMethod || 'Easypaisa',
      date: new Date(),
      status: 'Paid',
      invoiceId,
    });

    await user.save();

    await Notification.create({
      user: user._id,
      title: '🎉 Subscription Activated!',
      message: `You have successfully upgraded to the ${plan} Plan. +${bonusCredits} AI Credits added!`,
      type: 'system',
      link: '/subscription',
      isRead: false,
    });

    res.json({
      subscriptionTier: user.subscriptionTier,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      aiCredits: user.aiCredits,
      billingHistory: user.billingHistory,
      message: `Successfully upgraded to ${plan} Plan!`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Purchase AI Credits pack
// @route   POST /api/subscription/credits
// @access  Private
export const buyAiCredits = async (req, res) => {
  try {
    const { creditsPack, paymentMethod } = req.body;
    const credits = Number(creditsPack);

    const priceMap = {
      100: 499,
      250: 999,
      600: 1999,
    };

    const amount = priceMap[credits] || 499;
    const creditsToAdd = priceMap[credits] ? credits : 100;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.aiCredits = (user.aiCredits || 50) + creditsToAdd;

    const invoiceId = `CRED-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!user.billingHistory) {
      user.billingHistory = [];
    }

    user.billingHistory.unshift({
      planName: `${creditsToAdd} AI Credits Pack`,
      amount,
      paymentMethod: paymentMethod || 'Easypaisa',
      date: new Date(),
      status: 'Paid',
      invoiceId,
    });

    await user.save();

    await Notification.create({
      user: user._id,
      title: '⚡ AI Credits Added',
      message: `Successfully purchased ${creditsToAdd} AI Credits. Your new balance is ${user.aiCredits}.`,
      type: 'system',
      link: '/subscription',
      isRead: false,
    });

    res.json({
      subscriptionTier: user.subscriptionTier || 'Free',
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      aiCredits: user.aiCredits,
      billingHistory: user.billingHistory,
      message: `Successfully added ${creditsToAdd} AI Credits!`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
