import { useState, useEffect } from 'react';
import { PauseCircle, PlayCircle, Trash2, X, Clock, User, RefreshCw, ShoppingBag } from 'lucide-react';
import { Button } from '../ui/Button';
import { authFetch } from '../../utils/api';
import { formatPKDate, formatPKTime } from '../../utils/date';

interface HeldSaleItem {
  cartId?: string;
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

export interface HeldSaleRecord {
  _id: string;
  holdReference: string;
  customer?: string;
  customerName: string;
  customerPhone?: string;
  items: HeldSaleItem[];
  subtotal: number;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  taxRate: number;
  note?: string;
  createdAt: string;
}

interface HeldSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResumeSale: (heldSale: HeldSaleRecord) => void;
}

export default function HeldSalesModal({ isOpen, onClose, onResumeSale }: HeldSalesModalProps) {
  const [heldSales, setHeldSales] = useState<HeldSaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchHeldSales = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const res = await authFetch('/api/pos/held');
      if (res.ok) {
        const data = await res.json();
        setHeldSales(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error('Failed to fetch held sales:', err);
      setErrorMsg('Could not load held sales.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHeldSales();
    }
  }, [isOpen]);

  const handleDiscard = async (id: string) => {
    if (!confirm('Are you sure you want to discard this held sale?')) return;

    try {
      const res = await authFetch(`/api/pos/held/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHeldSales((prev) => prev.filter((h) => h._id !== id));
      }
    } catch (err: any) {
      alert('Failed to delete held sale.');
    }
  };

  const handleResume = async (sale: HeldSaleRecord) => {
    // Delete from held collection so it is not duplicated
    try {
      await authFetch(`/api/pos/held/${sale._id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Failed to delete resumed sale from server:', e);
    }
    onResumeSale(sale);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <PauseCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Held Counter Sales</h3>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                {heldSales.length} saved transactions awaiting checkout
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xs px-4 py-2 border-b border-red-200 dark:border-red-900 font-medium">
            {errorMsg}
          </div>
        )}

        {/* List of Held Sales */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400">
              <RefreshCw className="w-7 h-7 animate-spin text-amber-500 mb-2" />
              <span className="text-xs">Loading held carts...</span>
            </div>
          ) : heldSales.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-900 flex items-center justify-center mx-auto mb-2 text-gray-400">
                <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-slate-300">No Held Sales</h4>
              <p className="text-xs text-gray-500 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                When a customer is still deciding, click "Hold Sale" on the counter to serve other customers without losing items.
              </p>
            </div>
          ) : (
            heldSales.map((h) => {
              const totalItems = h.items.reduce((s, it) => s + (it.qty || 1), 0);
              return (
                <div
                  key={h._id}
                  className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800 space-y-2.5 hover:border-amber-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          {h.holdReference}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400 font-mono">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{formatPKTime(h.createdAt, false)} ({formatPKDate(h.createdAt)})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1 text-xs font-bold text-gray-900 dark:text-white">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{h.customerName}</span>
                        {h.customerPhone && (
                          <span className="text-[10px] text-gray-500 dark:text-slate-400 font-mono">
                            ({h.customerPhone})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Cart Subtotal</span>
                      <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                        Rs. {h.subtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Items Chips Preview */}
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 block">
                      {totalItems} Items in cart:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {h.items.map((it, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-slate-200 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-slate-800 font-medium"
                        >
                          {it.qty}x {it.name} {it.size ? `(${it.size})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  {h.note && (
                    <p className="text-[11px] italic text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-950 px-2 py-1 rounded-lg">
                      Note: {h.note}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-200/60 dark:border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => handleDiscard(h._id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Discard</span>
                    </button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => handleResume(h)}
                      className="text-xs py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 font-bold cursor-pointer"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Resume Sale</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
