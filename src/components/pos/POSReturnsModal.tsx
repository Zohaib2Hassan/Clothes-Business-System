import { useState, useEffect } from 'react';
import { RotateCcw, Search, CheckCircle2, AlertCircle, X, Receipt, RefreshCw, Shirt, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { authFetch } from '../../utils/api';
import { formatPKDate, formatPKTime } from '../../utils/date';
import clsx from 'clsx';

interface SaleItem {
  _id?: string;
  product?: string;
  productId: string;
  productName: string;
  size?: string;
  color?: string;
  qty: number;
  price: number;
  subtotal: number;
  returnedQty?: number;
}

interface SaleData {
  _id: string;
  receiptNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  returnStatus?: 'None' | 'Partial' | 'Full';
  refundAmount?: number;
}

interface ReturnItemState {
  selected: boolean;
  qtyToReturn: number;
}

interface POSReturnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnSuccess: (returnRecord: any) => void;
  initialReceiptNumber?: string;
}

export default function POSReturnsModal({
  isOpen,
  onClose,
  onReturnSuccess,
  initialReceiptNumber = '',
}: POSReturnsModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialReceiptNumber);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedSale, setSearchedSale] = useState<SaleData | null>(null);
  const [recentSales, setRecentSales] = useState<SaleData[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected return states mapped by item index or ID
  const [returnState, setReturnState] = useState<Record<number, ReturnItemState>>({});
  const [returnReason, setReturnReason] = useState('Size mismatch');
  const [refundMethod] = useState<'Easypaisa'>('Easypaisa');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load recent sales when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRecentSales();
      if (initialReceiptNumber) {
        handleSearchSale(initialReceiptNumber);
      }
    }
  }, [isOpen, initialReceiptNumber]);

  const fetchRecentSales = async () => {
    try {
      const res = await authFetch('/api/pos/sales?range=week');
      if (res.ok) {
        const data = await res.json();
        setRecentSales(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    }
  };

  const handleSearchSale = async (term = searchQuery) => {
    if (!term.trim()) return;
    try {
      setIsSearching(true);
      setErrorMsg('');
      setSearchedSale(null);
      const res = await authFetch(`/api/pos/sales?search=${encodeURIComponent(term.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const matched = data[0];
          setSearchedSale(matched);
          // Initialize return state
          const initialMap: Record<number, ReturnItemState> = {};
          matched.items.forEach((it: SaleItem, idx: number) => {
            const availableToReturn = it.qty - (it.returnedQty || 0);
            initialMap[idx] = {
              selected: false,
              qtyToReturn: availableToReturn > 0 ? 1 : 0,
            };
          });
          setReturnState(initialMap);
        } else {
          setErrorMsg(`No receipt or customer transaction found for "${term}".`);
        }
      } else {
        setErrorMsg('Error searching for sale.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error searching for sale.');
    } finally {
      setIsSearching(false);
    }
  };

  // Toggle item selection
  const toggleItemSelect = (idx: number) => {
    setReturnState((prev) => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        selected: !prev[idx]?.selected,
      },
    }));
  };

  // Update return quantity
  const updateReturnQty = (idx: number, delta: number, maxAllowed: number) => {
    setReturnState((prev) => {
      const current = prev[idx] || { selected: true, qtyToReturn: 1 };
      const newQty = Math.max(1, Math.min(maxAllowed, current.qtyToReturn + delta));
      return {
        ...prev,
        [idx]: {
          ...current,
          qtyToReturn: newQty,
        },
      };
    });
  };

  // Calculate total refund
  const totalRefund = searchedSale
    ? searchedSale.items.reduce((sum, item, idx) => {
        const state = returnState[idx];
        if (state?.selected && state.qtyToReturn > 0) {
          return sum + item.price * state.qtyToReturn;
        }
        return sum;
      }, 0)
    : 0;

  const handleProcessReturn = async () => {
    if (!searchedSale) return;

    const itemsToReturn = searchedSale.items
      .map((item, idx) => {
        const state = returnState[idx];
        if (state?.selected && state.qtyToReturn > 0) {
          return {
            itemId: item._id,
            productId: item.productId || (item.product as any),
            productName: item.productName,
            qty: state.qtyToReturn,
            unitPrice: item.price,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (itemsToReturn.length === 0) {
      alert('Please select at least one garment to return.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg('');

      const res = await authFetch('/api/pos/returns', {
        method: 'POST',
        body: JSON.stringify({
          saleId: searchedSale._id,
          itemsToReturn,
          reason: returnReason,
          paymentMethod: refundMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to process return');
      }

      setSuccessMsg(
        `Return ${data.returnRecord.returnNumber} processed successfully! Restocked ${itemsToReturn.length} items. Refund: Rs. ${totalRefund.toLocaleString()}.`
      );
      onReturnSuccess(data.returnRecord);

      // Re-fetch updated sale
      setTimeout(() => {
        handleSearchSale(searchedSale.receiptNumber);
        setSuccessMsg('');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing return.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/30">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Customer Return & Restock</h3>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                Audit trail refund with automatic inventory restock
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
          <div className="bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xs px-4 py-2 border-b border-red-200 dark:border-red-900 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs px-4 py-2 border-b border-emerald-200 dark:border-emerald-900 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchSale();
                }
              }}
              placeholder="Enter Receipt # (e.g. TH-2610-1234), phone or customer name..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
            />
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => handleSearchSale()}
            disabled={isSearching}
            className="text-xs px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer"
          >
            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Find Sale'}
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!searchedSale ? (
            /* Prompt to search or select recent sale */
            <div className="space-y-3">
              <div className="text-center py-6 text-gray-400">
                <Receipt className="w-10 h-10 mx-auto text-gray-400 mb-2 stroke-[1.5]" />
                <h4 className="text-xs font-bold text-gray-700 dark:text-slate-300">
                  Search previous sale above to process a return
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">
                  Or select a recent counter sale from the list below:
                </p>
              </div>

              {recentSales.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                    Recent Store Sales (Past 7 Days):
                  </span>
                  {recentSales.slice(0, 5).map((s) => (
                    <div
                      key={s._id}
                      onClick={() => {
                        setSearchQuery(s.receiptNumber);
                        handleSearchSale(s.receiptNumber);
                      }}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:border-red-500/60 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                            {s.receiptNumber}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-slate-400">
                            {formatPKDate(s.date)}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-slate-400 mt-0.5">
                          {s.customerName} • {s.items.length} items
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Rs. {s.totalAmount.toLocaleString()}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Sale Found & Item Selection */
            <div className="space-y-3">
              {/* Sale Overview Header */}
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      {searchedSale.receiptNumber}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 font-mono">
                      {formatPKDate(searchedSale.date)} ({formatPKTime(searchedSale.date, false)})
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">
                    Customer: {searchedSale.customerName} {searchedSale.customerPhone ? `(${searchedSale.customerPhone})` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Original Total</span>
                  <span className="font-mono text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    Rs. {searchedSale.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Items in Sale */}
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2 block">
                  Select Purchased Items to Return & Restock:
                </span>
                <div className="space-y-2">
                  {searchedSale.items.map((it, idx) => {
                    const alreadyReturned = it.returnedQty || 0;
                    const returnable = it.qty - alreadyReturned;
                    const isFullyReturned = returnable <= 0;
                    const state = returnState[idx] || { selected: false, qtyToReturn: 1 };

                    return (
                      <div
                        key={idx}
                        className={clsx(
                          'p-3 rounded-xl border transition-all flex items-center justify-between gap-3',
                          isFullyReturned
                            ? 'opacity-40 bg-gray-100 dark:bg-slate-900/40 border-gray-200 dark:border-slate-800 cursor-not-allowed'
                            : state.selected
                            ? 'bg-red-50/60 dark:bg-red-950/30 border-red-500/80 shadow-xs'
                            : 'bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 hover:border-gray-300'
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            disabled={isFullyReturned}
                            checked={state.selected}
                            onChange={() => toggleItemSelect(idx)}
                            className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                          />
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-center text-gray-400 shrink-0">
                            <Shirt className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {it.productName}
                            </h5>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                              {it.size && <span>Size: {it.size}</span>}
                              {it.color && <span>Color: {it.color}</span>}
                              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                Rs. {it.price.toLocaleString()} ea
                              </span>
                            </div>
                            <div className="text-[10px] font-mono mt-0.5">
                              <span>Bought: {it.qty}</span> •{' '}
                              {alreadyReturned > 0 && <span className="text-red-500">Returned: {alreadyReturned} • </span>}
                              <span className={returnable > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-400'}>
                                Eligible: {returnable}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stepper for return units */}
                        {state.selected && returnable > 0 && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => updateReturnQty(idx, -1, returnable)}
                              className="w-6 h-6 rounded bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-mono font-bold text-xs">
                              {state.qtyToReturn}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateReturnQty(idx, 1, returnable)}
                              className="w-6 h-6 rounded bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs cursor-pointer"
                            >
                              +
                            </button>
                            <span className="font-mono font-black text-xs text-red-600 dark:text-red-400 ml-2 w-20 text-right">
                              -Rs. {(it.price * state.qtyToReturn).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Return Options & Reason */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Return Reason</label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full text-xs font-semibold px-2 py-1.5 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Size mismatch">Size mismatch / Fitting issue</option>
                    <option value="Defective fabric">Defective fabric / Stitching defect</option>
                    <option value="Color exchange">Color exchange</option>
                    <option value="Customer mind change">Customer mind change</option>
                    <option value="Wrong item billed">Wrong item billed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Refund Method</label>
                  <div className="w-full text-xs font-bold px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <span>Easypaisa Mobile Wallet Reversal</span>
                  </div>
                </div>
              </div>

              {/* Total Refund Summary & Confirm */}
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-red-700 dark:text-red-400 tracking-wider block">
                    Total Amount to Refund
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    Will restock items to active inventory
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xl font-black text-red-600 dark:text-red-400">
                    Rs. {totalRefund.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSearchedSale(null)}
                  className="flex-1 text-xs py-2"
                >
                  Back to Search
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleProcessReturn}
                  disabled={isProcessing || totalRefund === 0}
                  className={clsx(
                    'flex-1 text-xs py-2 font-bold flex items-center justify-center gap-1.5 cursor-pointer',
                    totalRefund === 0
                      ? 'bg-gray-300 dark:bg-slate-800 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-md'
                  )}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Restocking & Refunding...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Process Return & Restock (Rs. {totalRefund.toLocaleString()})</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
