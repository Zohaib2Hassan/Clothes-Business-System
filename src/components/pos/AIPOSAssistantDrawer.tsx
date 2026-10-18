import { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Plus,
  TrendingUp,
  X,
  AlertTriangle,
  ShoppingBag,
  RefreshCw,
  Tag,
  CheckCircle2,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { authFetch } from '../../utils/api';
import clsx from 'clsx';

interface CartItem {
  cartId: string;
  productId: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  qty: number;
  size?: string;
  color?: string;
  maxStock: number;
  image?: string;
}

interface AIPOSAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  selectedCustomer: { _id?: string; name: string; phone?: string } | null;
  onAddToCart: (product: any, size?: string, color?: string, qty?: number) => void;
  onSetDiscount: (type: 'flat' | 'percentage', value: number) => void;
  onSelectCustomer: (customer: any) => void;
  subtotal: number;
  totalAmount: number;
}

export default function AIPOSAssistantDrawer({
  isOpen,
  onClose,
  cart,
  selectedCustomer,
  onAddToCart,
  onSetDiscount,
  onSelectCustomer,
  subtotal,
  totalAmount,
}: AIPOSAssistantDrawerProps) {
  const [activeTab, setActiveTab] = useState<'assistant' | 'recommendations' | 'mldemand' | 'summary'>('assistant');

  // Tab 1: Assistant & Commands
  const [promptInput, setPromptInput] = useState('');
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string; actionData?: any }>
  >([
    {
      role: 'assistant',
      content:
        'Hello! I am your AI POS Assistant. Ask me to find products, add variants to cart, or set discounts.',
    },
  ]);

  // Tab 2: Recommendations
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  // Tab 3: ML Demand Insights
  const [selectedMLProduct, setSelectedMLProduct] = useState<CartItem | null>(null);
  const [mlInsight, setMlInsight] = useState<any | null>(null);
  const [isLoadingML, setIsLoadingML] = useState(false);

  // Tab 4: Checkout Summary
  const [checkoutSummary, setCheckoutSummary] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Fetch recommendations whenever cart changes and drawer is on recommendations tab
  useEffect(() => {
    if (isOpen && activeTab === 'recommendations' && cart.length > 0) {
      fetchRecommendations();
    }
  }, [isOpen, activeTab, cart.length]);

  // Sync ML selection
  useEffect(() => {
    if (cart.length > 0 && !selectedMLProduct) {
      setSelectedMLProduct(cart[0]);
    }
  }, [cart]);

  useEffect(() => {
    if (selectedMLProduct && activeTab === 'mldemand') {
      fetchMLDemand(selectedMLProduct.productId);
    }
  }, [selectedMLProduct, activeTab]);

  const handleSendCommand = async (commandText = promptInput) => {
    if (!commandText.trim()) return;
    const userText = commandText.trim();
    setPromptInput('');
    setAssistantMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setIsProcessingCommand(true);

    try {
      const res = await authFetch('/api/pos/ai/action', {
        method: 'POST',
        body: JSON.stringify({ command: userText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error executing AI action');
      }

      setAssistantMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message || 'Action interpreted.',
          actionData: data,
        },
      ]);
    } catch (err: any) {
      setAssistantMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err.message || 'Sorry, I encountered an issue processing that command.',
        },
      ]);
    } finally {
      setIsProcessingCommand(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setIsLoadingRecs(true);
      const res = await authFetch('/api/pos/ai/recommendations', {
        method: 'POST',
        body: JSON.stringify({
          cartItems: cart,
          customerId: selectedCustomer?._id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (e) {
      console.error('Recommendations error:', e);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const fetchMLDemand = async (productId: string) => {
    try {
      setIsLoadingML(true);
      setMlInsight(null);
      const res = await authFetch(`/api/pos/ml-demand/${productId}`);
      if (res.ok) {
        const data = await res.json();
        setMlInsight(data);
      }
    } catch (e) {
      console.error('ML Demand fetch error:', e);
    } finally {
      setIsLoadingML(false);
    }
  };

  const fetchCheckoutSummary = async () => {
    try {
      setIsLoadingSummary(true);
      const res = await authFetch('/api/pos/ai/summary', {
        method: 'POST',
        body: JSON.stringify({
          cartItems: cart,
          subtotal,
          totalAmount,
          customerName: selectedCustomer?.name || 'Walk-in Customer',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCheckoutSummary(data.summary || '');
      }
    } catch (e) {
      console.error('Summary error:', e);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white dark:bg-slate-950 shadow-2xl border-l border-gray-200 dark:border-slate-800 z-50 flex flex-col text-gray-900 dark:text-white animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Threadly AI Assistant</h3>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded font-bold uppercase">
                Gemini + ML
              </span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-slate-400">Natural language counter companion</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex gap-1 text-[11px] font-bold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('assistant')}
          className={clsx(
            'px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap',
            activeTab === 'assistant'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>POS Assistant</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('recommendations');
            fetchRecommendations();
          }}
          className={clsx(
            'px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap',
            activeTab === 'recommendations'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Cross-Sell ({recommendations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mldemand')}
          className={clsx(
            'px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap',
            activeTab === 'mldemand'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>ML Demand</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('summary');
            if (!checkoutSummary) fetchCheckoutSummary();
          }}
          className={clsx(
            'px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap',
            activeTab === 'summary'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Cart Summary</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* TAB 1: NATURAL ASSISTANT & COMMANDS */}
        {activeTab === 'assistant' && (
          <div className="h-full flex flex-col justify-between space-y-3">
            {/* Quick Sample Prompts */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Quick Commands:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Suggest products under 5000',
                  'Show suits under 10000',
                  'Add two classic kurtas size M',
                  'Set 10 percent discount',
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => handleSendCommand(sample)}
                    className="text-[10px] bg-gray-100 hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:text-emerald-600 rounded-lg px-2 py-1 transition-colors cursor-pointer"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[220px]">
              {assistantMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={clsx(
                    'flex flex-col text-xs leading-relaxed max-w-[90%]',
                    msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  )}
                >
                  <div
                    className={clsx(
                      'p-3 rounded-2xl shadow-xs',
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-slate-800'
                    )}
                  >
                    <p className="font-medium">{msg.content}</p>

                    {/* Action Execution Widget */}
                    {msg.actionData && (
                      <div className="mt-2.5 pt-2 border-t border-gray-200 dark:border-slate-800 space-y-1.5">
                        {/* Suggest Products List */}
                        {msg.actionData.products && Array.isArray(msg.actionData.products) && msg.actionData.products.length > 0 && (
                          <div className="space-y-1.5 pt-1 max-h-56 overflow-y-auto pr-1">
                            {msg.actionData.products.map((prod: any) => (
                              <div
                                key={prod._id || prod.id}
                                className="flex items-center justify-between gap-2 bg-white dark:bg-slate-950 p-2 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xs"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-xs truncate text-gray-900 dark:text-white">
                                    {prod.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                                      Rs. {prod.price.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-mono">
                                      {prod.stock} pcs
                                    </span>
                                    {prod.category && (
                                      <span className="text-[9px] text-gray-400 uppercase">
                                        {prod.category}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="primary"
                                  onClick={() => onAddToCart(prod, prod.sizes?.[0] || 'Standard', prod.colors?.[0] || 'Default', 1)}
                                  className="text-[10px] py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shrink-0"
                                >
                                  + Add
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.actionData.action === 'add_to_cart' && msg.actionData.product && (
                          <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-950 p-2 rounded-xl border border-gray-200 dark:border-slate-800">
                            <div>
                              <p className="font-bold text-xs truncate max-w-[170px]">
                                {msg.actionData.product.name}
                              </p>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                                Rs. {msg.actionData.product.price.toLocaleString()} • Qty: {msg.actionData.qty}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="primary"
                              onClick={() => {
                                onAddToCart(
                                  msg.actionData.product,
                                  msg.actionData.size,
                                  msg.actionData.color,
                                  msg.actionData.qty
                                );
                              }}
                              className="text-[10px] py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                            >
                              + Confirm Add
                            </Button>
                          </div>
                        )}

                        {msg.actionData.action === 'set_discount' && (
                          <Button
                            type="button"
                            variant="primary"
                            onClick={() =>
                              onSetDiscount(
                                msg.actionData.discountType || 'percentage',
                                msg.actionData.discountValue
                              )
                            }
                            className="w-full text-xs py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Tag className="w-3.5 h-3.5" />
                            <span>Apply {msg.actionData.discountValue}% Discount</span>
                          </Button>
                        )}

                        {msg.actionData.action === 'find_customer' && msg.actionData.customer && (
                          <Button
                            type="button"
                            variant="primary"
                            onClick={() => onSelectCustomer(msg.actionData.customer)}
                            className="w-full text-xs py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Select Customer {msg.actionData.customer.name}</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isProcessingCommand && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 italic">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  <span>Gemini interpreting command...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCommand();
              }}
              className="relative pt-2"
            >
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Ask POS Assistant or type command..."
                className="w-full pl-3 pr-10 py-2.5 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium"
              />
              <button
                type="submit"
                disabled={isProcessingCommand || !promptInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 mt-1 p-1.5 rounded-lg bg-emerald-600 text-white disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: SMART CROSS-SELLING & RECOMMENDATIONS */}
        {activeTab === 'recommendations' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Complementary Garments</h4>
                <p className="text-[10px] text-gray-500 dark:text-slate-400">
                  {selectedCustomer
                    ? `Based on ${selectedCustomer.name}'s purchase history & cart`
                    : 'Pairs well with current garments in register'}
                </p>
              </div>
              <button
                type="button"
                onClick={fetchRecommendations}
                disabled={isLoadingRecs}
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 cursor-pointer"
              >
                <RefreshCw className={clsx('w-3.5 h-3.5', isLoadingRecs && 'animate-spin')} />
              </button>
            </div>

            {isLoadingRecs ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
                <span className="text-xs">Analyzing catalog & recommendations...</span>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50 stroke-[1.5]" />
                <p className="font-bold">No recommendations available</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Add items to cart or select a customer to see tailored fashion suggestions.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recommendations.map((rec) => (
                  <div
                    key={rec._id}
                    className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-2 hover:border-emerald-500/60 transition-colors shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                          {rec.category}
                        </span>
                        <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate leading-snug">
                          {rec.name}
                        </h5>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            Rs. {rec.price.toLocaleString()}
                          </span>
                          <span>•</span>
                          <span>{rec.stock} in stock</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => onAddToCart(rec, rec.sizes[0] || 'Standard', rec.colors[0] || 'Default', 1)}
                        className="text-xs py-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </Button>
                    </div>

                    {rec.reason && (
                      <p className="text-[11px] text-gray-600 dark:text-slate-300 italic bg-white dark:bg-slate-950 p-2 rounded-xl border border-gray-200/80 dark:border-slate-800/80">
                        "{rec.reason}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ML DEMAND & STOCKOUT WARNINGS */}
        {activeTab === 'mldemand' && (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">ML Demand Forecaster & Risk</h4>
              <p className="text-[10px] text-gray-500 dark:text-slate-400">
                Machine Learning 7-day predicted demand vs. store stock
              </p>
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                Add garments to cart to inspect machine learning forward demand.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Product Selector from Cart */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Select Cart Item:</label>
                  <select
                    value={selectedMLProduct?.productId || ''}
                    onChange={(e) => {
                      const item = cart.find((c) => c.productId === e.target.value);
                      if (item) setSelectedMLProduct(item);
                    }}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white"
                  >
                    {cart.map((c) => (
                      <option key={c.cartId} value={c.productId}>
                        {c.name} ({c.sku})
                      </option>
                    ))}
                  </select>
                </div>

                {isLoadingML ? (
                  <div className="py-8 flex flex-col items-center justify-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
                    <span className="text-xs">Running ML predictive engine...</span>
                  </div>
                ) : mlInsight ? (
                  <div className="space-y-2.5 animate-in fade-in">
                    {/* Numbers Card */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-center">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block">Current Stock</span>
                        <span className="font-mono text-xl font-black text-gray-900 dark:text-white">
                          {mlInsight.currentStock} pcs
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-center">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block">7-Day ML Demand</span>
                        <span className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
                          ~{mlInsight.predictedWeeklyUnits} pcs
                        </span>
                      </div>
                    </div>

                    {/* Risk Badge */}
                    <div
                      className={clsx(
                        'p-3 rounded-2xl border flex items-start gap-2.5',
                        mlInsight.isUnderstocked
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                      )}
                    >
                      {mlInsight.isUnderstocked ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h5 className="font-bold text-xs">
                          {mlInsight.isUnderstocked ? 'High Demand / Potential Stockout' : 'Adequate Inventory'}
                        </h5>
                        <p className="text-[11px] mt-0.5 leading-snug">{mlInsight.insight}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CHECKOUT BUSINESS SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">AI Counter Summary</h4>
                <p className="text-[10px] text-gray-500 dark:text-slate-400">
                  Concise executive review before completing payment
                </p>
              </div>
              <button
                type="button"
                onClick={fetchCheckoutSummary}
                disabled={isLoadingSummary}
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 cursor-pointer"
              >
                <RefreshCw className={clsx('w-3.5 h-3.5', isLoadingSummary && 'animate-spin')} />
              </button>
            </div>

            {isLoadingSummary ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
                <span className="text-xs">Generating business summary...</span>
              </div>
            ) : checkoutSummary ? (
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Executive Brief:</span>
                </div>
                <p className="text-xs text-gray-800 dark:text-slate-200 leading-relaxed font-medium">
                  {checkoutSummary}
                </p>
                <div className="pt-2 border-t border-gray-200 dark:border-slate-800 text-[10px] text-gray-500 flex justify-between font-mono">
                  <span>Cart Items: {cart.length}</span>
                  <span>Payable: Rs. {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 text-xs">
                Click refresh above to generate an executive AI summary for this cart.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
