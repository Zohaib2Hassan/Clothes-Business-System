import {
  Gift,
  Crown,
  Zap,
  Sparkles,
  Check,
  Receipt,
  X,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  Clock,
  Printer,
  Lock
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../utils/api';
import clsx from 'clsx';

interface BillingRecord {
  planName: string;
  amount: number;
  paymentMethod: string;
  date: string;
  status: string;
  invoiceId: string;
}

interface SubscriptionData {
  subscriptionTier: string;
  subscriptionExpiresAt?: string;
  aiCredits: number;
  billingHistory: BillingRecord[];
}

export default function Subscription() {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'plans' | 'credits' | 'billing'>('plans');
  const [subData, setSubData] = useState<SubscriptionData>({
    subscriptionTier: user?.subscriptionTier || 'Free',
    aiCredits: 50,
    billingHistory: [],
  });
  const [_isLoading, setIsLoading] = useState(false);

  // Modal State for Checkout (EasyPaisa Exclusive)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'plan' | 'credits';
    name: string;
    price: number;
    period?: string;
    credits?: number;
  } | null>(null);
  const paymentMethod = 'EasyPaisa';
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Modal for Viewing Receipt
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<BillingRecord | null>(null);

  // Fetch subscription info from backend
  const fetchSubscription = async () => {
    try {
      setIsLoading(true);
      const res = await authFetch('/api/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubData(data);
        if (data.subscriptionTier && user) {
          updateUser({ subscriptionTier: data.subscriptionTier });
        }
      }
    } catch (err) {
      console.error('Failed to load subscription details', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const currentTier = subData.subscriptionTier || user?.subscriptionTier || 'Free';

  // Handle plan purchase or upgrade
  const handleOpenCheckout = (
    type: 'plan' | 'credits',
    name: string,
    price: number,
    period?: string,
    credits?: number
  ) => {
    setSelectedItem({ type, name, price, period, credits });
    setCheckoutSuccess(false);
    setCheckoutModalOpen(true);
  };

  // Unified checkout handler — EasyPaisa mobile wallet
  const handleCheckout = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);

    try {
      if (selectedItem.type === 'plan') {
        const res = await authFetch('/api/subscription/upgrade', {
          method: 'POST',
          body: JSON.stringify({
            plan: selectedItem.name,
            paymentMethod,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setSubData((prev) => ({
            ...prev,
            subscriptionTier: data.subscriptionTier || prev.subscriptionTier,
            subscriptionExpiresAt: data.subscriptionExpiresAt,
            aiCredits: data.aiCredits !== undefined ? data.aiCredits : prev.aiCredits,
            billingHistory: data.billingHistory || prev.billingHistory,
          }));

          if (data.subscriptionTier && user) {
            updateUser({ subscriptionTier: data.subscriptionTier });
          }

          setCheckoutSuccess(true);
          setTimeout(() => {
            setCheckoutModalOpen(false);
            setCheckoutSuccess(false);
            window.dispatchEvent(new CustomEvent('notifications:refresh'));
          }, 2000);
        } else {
          alert(data.message || 'Payment failed');
        }
      } else {
        const res = await authFetch('/api/subscription/credits', {
          method: 'POST',
          body: JSON.stringify({
            creditsPack: selectedItem.credits,
            paymentMethod,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setSubData((prev) => ({
            ...prev,
            aiCredits: data.aiCredits !== undefined ? data.aiCredits : prev.aiCredits,
            billingHistory: data.billingHistory || prev.billingHistory,
          }));

          setCheckoutSuccess(true);
          setTimeout(() => {
            setCheckoutModalOpen(false);
            setCheckoutSuccess(false);
            window.dispatchEvent(new CustomEvent('notifications:refresh'));
          }, 2000);
        } else {
          alert(data.message || 'Payment failed');
        }
      }
    } catch (err: any) {
      console.error('[EasyPaisa] Checkout error:', err);
      alert(err.message || 'Network error processing EasyPaisa payment.');
    } finally {
      setIsProcessing(false);
    }
  };


  const plans = [
    {
      name: 'Free',
      icon: <Gift className="w-6 h-6 text-brand-800" />,
      description: 'Basic features to get started',
      price: 0,
      priceFormatted: 'Rs. 0',
      period: '/ month',
      features: ['Up to 50 products', 'Basic reports', '50 AI Credits included', 'Standard support'],
      cta: 'Free Plan',
      isPopular: false,
    },
    {
      name: 'Premium',
      icon: <Crown className="w-6 h-6 text-orange-500" />,
      description: 'Advanced analytics & features',
      price: 1499,
      priceFormatted: 'Rs. 1,499',
      period: '/ month',
      features: ['Unlimited products', 'Advanced analytics', '+100 Bonus AI Credits', 'Priority support', 'Export reports & bills'],
      cta: 'Upgrade to Premium',
      isPopular: true,
    },
    {
      name: 'Annual',
      icon: <Zap className="w-6 h-6 text-red-500" />,
      description: 'Best value for growing businesses',
      price: 14390,
      priceFormatted: 'Rs. 14,390',
      period: '/ year',
      subPrice: '(Rs. 1,199 / month)',
      features: ['All Premium features', '2 months completely free', '+500 Bonus AI Credits', 'Dedicated manager', 'Early access to features'],
      cta: 'Upgrade to Annual',
      isPopular: false,
      badge: 'Save 20%',
    },
    {
      name: 'AI Credits',
      icon: <Sparkles className="w-6 h-6 text-blue-500" />,
      description: 'Extra AI usage for predictions',
      price: 499,
      priceFormatted: 'Rs. 499',
      period: '/ 100 credits',
      features: ['Use AI Assistant', 'Generate sales forecasts', 'Get smart inventory tips', 'Valid for 6 months'],
      cta: 'Buy 100 Credits',
      isPopular: false,
    },
  ];

  const creditPacks = [
    {
      credits: 100,
      name: 'Starter AI Pack',
      price: 499,
      popular: false,
      description: 'Ideal for occasional predictions & assistance',
      perks: ['100 AI queries & predictions', 'Valid for 6 months', 'Instant activation'],
    },
    {
      credits: 250,
      name: 'Growth AI Pack',
      price: 999,
      popular: true,
      badge: 'Save 20%',
      description: 'Best for weekly business forecasting & restock advice',
      perks: ['250 AI queries & predictions', 'Valid for 1 year', 'Priority AI processing queue', 'Deep sales analysis'],
    },
    {
      credits: 600,
      name: 'Pro Power Pack',
      price: 1999,
      popular: false,
      badge: 'Save 33%',
      description: 'Maximum AI capabilities for high-volume boutiques',
      perks: ['600 AI queries & predictions', 'No expiration date', 'VIP Dedicated AI compute', 'Automated restock triggers'],
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Revenue / Subscription</h1>
          <p className="text-gray-500 text-sm mt-1">Unlock more power, automation and AI tools for your clothing business.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setActiveTab('billing')}
            className={clsx(
              "flex items-center gap-2",
              activeTab === 'billing' && "border-brand-800 text-brand-800 bg-brand-50"
            )}
          >
            <Receipt className="w-4 h-4" />
            Manage Billing & Invoices
          </Button>
        </div>
      </div>

      {/* Active Subscription Summary Bar */}
      <div className="bg-gradient-to-r from-gray-900 via-brand-950 to-brand-900 text-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs text-amber-400">
            {currentTier === 'Annual' ? <Zap className="w-7 h-7 text-amber-400" /> : currentTier === 'Premium' ? <Crown className="w-7 h-7 text-amber-400" /> : <Gift className="w-7 h-7 text-brand-300" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-brand-200 font-semibold">Active Plan</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                Active
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{currentTier} Plan</h2>
            {subData.subscriptionExpiresAt ? (
              <p className="text-xs text-gray-300 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                Renews on {new Date(subData.subscriptionExpiresAt).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-xs text-gray-300 mt-0.5">Free tier with essential clothing inventory tools</p>
            )}
          </div>
        </div>

        {/* AI Credits Badge */}
        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-brand-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Available AI Credits</span>
            </div>
            <p className="text-2xl font-black text-amber-300 tracking-tight">
              {subData.aiCredits !== undefined ? subData.aiCredits : 50}
            </p>
          </div>
          <Button
            variant="white"
            onClick={() => setActiveTab('credits')}
            className="text-xs py-2 px-3.5 font-bold rounded-lg shrink-0 cursor-pointer shadow-sm text-gray-900 bg-white hover:bg-gray-100 border border-white/20"
          >
            Buy Credits
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('plans')}
          className={clsx(
            "px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'plans'
              ? "border-brand-800 text-brand-800 bg-brand-50/40"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
          )}
        >
          <Crown className="w-4 h-4" />
          Subscription Plans
        </button>

        <button
          onClick={() => setActiveTab('credits')}
          className={clsx(
            "px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'credits'
              ? "border-brand-800 text-brand-800 bg-brand-50/40"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
          )}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          AI Credits Store
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={clsx(
            "px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'billing'
              ? "border-brand-800 text-brand-800 bg-brand-50/40"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
          )}
        >
          <Receipt className="w-4 h-4" />
          Billing History & Invoices
        </button>
      </div>

      {/* TAB 1: SUBSCRIPTION PLANS */}
      {activeTab === 'plans' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isCurrent = currentTier.toLowerCase() === plan.name.toLowerCase();

              return (
                <Card
                  key={plan.name}
                  className={clsx(
                    "relative border-2 transition-all hover:shadow-lg flex flex-col justify-between",
                    isCurrent
                      ? "border-emerald-500 bg-emerald-50/10 shadow-md ring-2 ring-emerald-500/20"
                      : plan.isPopular
                        ? "border-brand-800 shadow-md"
                        : "border-gray-200"
                  )}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> Active Plan
                      </span>
                    </div>
                  )}

                  {!isCurrent && plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {!isCurrent && plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <CardContent className="pt-8 pb-6 flex flex-col h-full">
                    <div className="mb-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-3 border border-gray-100">
                        {plan.icon}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                    </div>

                    <div className="mb-6">
                      <span className="text-2xl font-bold text-gray-900">{plan.priceFormatted}</span>
                      <span className="text-sm text-gray-500 ml-1">{plan.period}</span>
                      {plan.subPrice && (
                        <p className="text-xs text-emerald-600 font-medium mt-1">{plan.subPrice}</p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-brand-800 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <Button
                        variant="outline"
                        className="w-full bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold cursor-default"
                        disabled
                      >
                        ✓ Current Active Plan
                      </Button>
                    ) : (
                      <Button
                        variant={plan.isPopular ? 'primary' : 'outline'}
                        className="w-full font-semibold cursor-pointer"
                        onClick={() => {
                          if (plan.name === 'AI Credits') {
                            handleOpenCheckout('credits', '100 AI Credits', 499, undefined, 100);
                          } else {
                            handleOpenCheckout('plan', plan.name, plan.price, plan.period);
                          }
                        }}
                      >
                        {plan.cta}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CTA Banner */}
          <div className="bg-brand-900 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-lg">
            <div className="absolute right-0 top-0 w-80 h-full opacity-20 pointer-events-none">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-brand-800 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Take Your Clothing Business to the Next Level</h3>
              </div>
              <p className="text-brand-200 text-sm max-w-xl">
                Get full access to AI assistant, automated re-ordering recommendations, multi-currency support, and unlimited product listings.
              </p>
            </div>
            <Button
              variant="white"
              onClick={() => handleOpenCheckout('plan', 'Premium', 1499, '/ month')}
              className="z-10 bg-white text-gray-900 hover:bg-gray-100 shrink-0 px-8 py-3 font-bold cursor-pointer shadow-md text-sm"
            >
              {currentTier === 'Free' ? 'Upgrade to Premium Now' : 'Manage Subscription'}
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: AI CREDITS STORE */}
      {activeTab === 'credits' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">AI Assistant & Forecast Credits</h3>
                <p className="text-sm text-gray-600">
                  Each AI action (such as generating 30-day demand predictions or fashion trend insights) consumes 1 to 5 credits.
                </p>
              </div>
            </div>
            <div className="bg-white px-5 py-3 rounded-xl border border-amber-200 text-center shrink-0">
              <p className="text-xs text-gray-500 font-semibold uppercase">Current Balance</p>
              <p className="text-2xl font-black text-amber-600">{subData.aiCredits !== undefined ? subData.aiCredits : 50} Credits</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPacks.map((pack) => (
              <Card
                key={pack.name}
                className={clsx(
                  "relative border-2 hover:shadow-lg transition-all flex flex-col justify-between",
                  pack.popular ? "border-brand-800 shadow-md ring-1 ring-brand-800/10" : "border-gray-200"
                )}
              >
                {pack.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {pack.badge}
                    </span>
                  </div>
                )}

                <CardContent className="pt-8 pb-6 flex flex-col h-full">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center mb-3">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{pack.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{pack.description}</p>

                    <div className="my-5">
                      <span className="text-3xl font-black text-gray-900">Rs. {pack.price.toLocaleString()}</span>
                      <span className="text-sm text-gray-500 ml-1">/ {pack.credits} Credits</span>
                    </div>

                    <ul className="space-y-2.5 mb-8 border-t border-gray-100 pt-4">
                      {pack.perks.map((perk, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                          <Check className="w-3.5 h-3.5 text-brand-800 shrink-0" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    variant={pack.popular ? 'primary' : 'outline'}
                    onClick={() => handleOpenCheckout('credits', pack.name, pack.price, undefined, pack.credits)}
                    className="w-full font-semibold cursor-pointer"
                  >
                    Buy {pack.credits} Credits
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BILLING HISTORY & INVOICES */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <Card>
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Payment History & Tax Invoices</h3>
                <p className="text-xs text-gray-500 mt-0.5">Download or review receipts for your accounting and business tax records.</p>
              </div>
              <Button
                variant="outline"
                onClick={fetchSubscription}
                className="text-xs py-1.5 gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                Refresh Records
              </Button>
            </div>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Invoice ID</th>
                      <th className="px-6 py-3.5">Description</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Payment Method</th>
                      <th className="px-6 py-3.5 text-right">Amount</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                      <th className="px-6 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subData.billingHistory && subData.billingHistory.length > 0 ? (
                      subData.billingHistory.map((rec, idx) => (
                        <tr key={rec.invoiceId || idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-900">
                            {rec.invoiceId}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {rec.planName}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {new Date(rec.date).toLocaleDateString()} {new Date(rec.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-xs">
                            <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded font-medium">
                              <Wallet className="w-3 h-3 text-gray-500" />
                              {rec.paymentMethod}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900">
                            Rs. {rec.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-full font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              {rec.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedReceipt(rec);
                                setReceiptModalOpen(true);
                              }}
                              className="text-xs text-brand-800 hover:text-brand-900 font-semibold underline cursor-pointer"
                            >
                              View Receipt
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                          <Receipt className="w-8 h-8 mx-auto mb-2 text-gray-300 stroke-[1.5]" />
                          <p className="text-sm font-medium text-gray-600">No payment history yet.</p>
                          <p className="text-xs text-gray-400 mt-0.5">When you upgrade or purchase AI credits, your invoices will appear here.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CHECKOUT / PAYMENT MODAL */}
      {checkoutModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header — Dark green with CHECKOUT / Plan name */}
            <div className="px-6 py-5 bg-brand-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-[0.15em] text-brand-200 font-bold">Checkout</span>
                <h3 className="text-xl font-bold text-white mt-0.5">{selectedItem.name}</h3>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {checkoutSuccess ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Payment Successful!</h4>
                  <p className="text-sm text-gray-600">Your account has been upgraded and benefits are immediately active.</p>
                </div>
              ) : (
                <>
                  {/* Amount Box */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Total Amount Due</p>
                      <p className="text-2xl font-black text-gray-900 tracking-tight">Rs. {selectedItem.price.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-500">
                        {selectedItem.period || '/ one-time'}
                      </span>
                    </div>
                  </div>

                  {/* Payment Method — EasyPaisa Sole Gateway */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-[0.12em] mb-2.5">
                      Payment Method
                    </label>
                    <div className="flex items-center gap-3 p-3.5 bg-emerald-50/70 border-2 border-emerald-600 rounded-2xl shadow-xs">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-gray-900">EasyPaisa Mobile Wallet & QR</h4>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                            Official Method
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          Instant subscription activation via EasyPaisa mobile account
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* EasyPaisa Wallet Information */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Secure mobile checkout via official EasyPaisa wallet.</span>
                  </div>

                  {/* Main Action Button */}
                  <div className="pt-1">
                    <button
                      onClick={handleCheckout}
                      disabled={isProcessing}
                      className={clsx(
                        "w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all",
                        "bg-brand-900 hover:bg-brand-950 text-white",
                        isProcessing && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Pay Rs. {selectedItem.price.toLocaleString()} via EasyPaisa
                        </>
                      )}
                    </button>
                    <p className="text-center text-[11px] text-gray-400 mt-2.5 flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-500" />
                      256-bit encrypted secure checkout. Instant activation.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT / INVOICE VIEW MODAL */}
      {receiptModalOpen && selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h4 className="text-lg font-bold text-gray-900">Official Payment Receipt</h4>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedReceipt.invoiceId}</p>
              </div>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Billed To</span>
                <span className="font-semibold text-gray-900">{user?.name || 'Store Owner'} ({user?.email})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Date & Time</span>
                <span className="font-semibold text-gray-900">{new Date(selectedReceipt.date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Item Purchased</span>
                <span className="font-semibold text-gray-900">{selectedReceipt.planName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Payment Channel</span>
                <span className="font-semibold text-gray-900">{selectedReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-bold border-t border-gray-200 mt-2">
                <span>Total Paid</span>
                <span className="text-brand-800">Rs. {selectedReceipt.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="w-full text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </Button>
              <Button
                variant="primary"
                onClick={() => setReceiptModalOpen(false)}
                className="w-full text-xs font-semibold cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
