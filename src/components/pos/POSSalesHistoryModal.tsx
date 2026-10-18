import { useState, useEffect } from 'react';
import { History, Search, Printer, RotateCcw, X, Clock, User, RefreshCw, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { Button } from '../ui/Button';
import { authFetch } from '../../utils/api';
import { formatPKDate, formatPKTime } from '../../utils/date';
import clsx from 'clsx';

interface POSSalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReprintReceipt: (sale: any) => void;
  onInitiateReturn: (sale: any) => void;
}

export default function POSSalesHistoryModal({
  isOpen,
  onClose,
  onReprintReceipt,
  onInitiateReturn,
}: POSSalesHistoryModalProps) {
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rangeFilter, setRangeFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  const fetchSales = async (range = rangeFilter, search = searchQuery) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (range !== 'all') params.set('range', range);
      if (search.trim()) params.set('search', search.trim());

      const res = await authFetch(`/api/pos/sales?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSales(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error('Failed to fetch sales:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSales(rangeFilter, searchQuery);
    }
  }, [isOpen, rangeFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">POS Sales Register History</h3>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                Audit transactions, reprint receipts & initiate returns
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

        {/* Filters & Search */}
        <div className="p-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/60 space-y-2">
          {/* Range Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(['today', 'yesterday', 'week', 'month', 'all'] as const).map((rng) => (
              <button
                key={rng}
                type="button"
                onClick={() => setRangeFilter(rng)}
                className={clsx(
                  'px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer',
                  rangeFilter === rng
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
                )}
              >
                {rng === 'all' ? 'All Time' : rng === 'week' ? 'This Week' : rng === 'month' ? 'This Month' : rng}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                fetchSales(rangeFilter, e.target.value);
              }}
              placeholder="Filter by Receipt #, customer name, or phone..."
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Sales List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400">
              <RefreshCw className="w-7 h-7 animate-spin text-emerald-500 mb-2" />
              <span className="text-xs">Loading sales history...</span>
            </div>
          ) : sales.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <ShoppingBag className="w-10 h-10 mx-auto text-gray-400 mb-2 stroke-[1.5]" />
              <h4 className="text-xs font-bold text-gray-700 dark:text-slate-300">No Sales Found</h4>
              <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">
                No transactions match the selected filter.
              </p>
            </div>
          ) : (
            sales.map((s) => {
              const isExpanded = expandedSaleId === s._id;
              const hasReturn = s.returnStatus && s.returnStatus !== 'None';
              return (
                <div
                  key={s._id}
                  className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 overflow-hidden shadow-xs hover:border-emerald-500/50 transition-colors"
                >
                  {/* Summary Bar */}
                  <div className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-gray-900 dark:text-white">
                            {s.receiptNumber}
                          </span>
                          <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-mono px-1.5 py-0.2 rounded border border-gray-200 dark:border-slate-700">
                            {s.paymentMethod}
                          </span>
                          {hasReturn && (
                            <span className="text-[9px] bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                              {s.returnStatus === 'Full' ? 'Returned' : 'Partial Return'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatPKDate(s.date)} {formatPKTime(s.date, false)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-slate-300">
                            <User className="w-2.5 h-2.5" />
                            {s.customerName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                          Rs. {s.totalAmount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          {s.items?.length || 0} items
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedSaleId(isExpanded ? null : s._id)}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Items & Actions */}
                  {isExpanded && (
                    <div className="p-3 bg-gray-50/80 dark:bg-slate-950/70 border-t border-gray-100 dark:border-slate-800/80 space-y-2.5 animate-in fade-in">
                      <div className="space-y-1">
                        {s.items?.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs py-0.5 border-b border-gray-100 dark:border-slate-800/40">
                            <div>
                              <span className="font-bold text-gray-800 dark:text-slate-200">{item.productName}</span>
                              {(item.size || item.color) && (
                                <span className="text-[10px] text-gray-500 dark:text-slate-400 ml-1.5 font-mono">
                                  ({item.size} {item.color})
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-gray-600 dark:text-slate-400">
                              {item.qty} x Rs. {item.price.toLocaleString()} ={' '}
                              <span className="font-bold text-gray-900 dark:text-white">
                                Rs. {(item.price * item.qty).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-200/60 dark:border-slate-800">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            onReprintReceipt(s);
                            onClose();
                          }}
                          className="text-xs py-1 px-3 border-gray-300 dark:border-slate-700 flex items-center gap-1.5 font-bold cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Reprint Receipt</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            onInitiateReturn(s);
                            onClose();
                          }}
                          className="text-xs py-1 px-3 border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-1.5 font-bold cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Process Return</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
