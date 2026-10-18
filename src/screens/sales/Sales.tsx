import { Search, Plus, Trash2, Calendar, Clock, LayoutGrid, List, Receipt, Printer, ShoppingBag, TrendingUp, Tag, Coins } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { authFetch } from '../../utils/api';
import { formatPKDate, formatPKTime, getPKCurrentDate } from '../../utils/date';
import { useLanguage } from '../../context/LanguageContext';
import ThermalReceipt, { type ReceiptData } from '../../components/pos/ThermalReceipt';
import clsx from 'clsx';

export default function Sales() {
  const { t } = useLanguage();
  const location = useLocation();
  const [salesList, setSalesList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View Mode: 'cards' or 'table' (persisted in localStorage)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('threadly_sales_view') as 'cards' | 'table') || 'cards';
  });

  const handleSetViewMode = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('threadly_sales_view', mode);
  };

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | '7' | '15' | '30'>('all');

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/sales');
      if (response.ok) {
        const data = await response.json();
        setSalesList(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch sales', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [location]);

  const handleDeleteSale = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const response = await authFetch(`/api/sales/${deleteId}`, { method: 'DELETE' });
      if (response.ok) {
        setDeleteId(null);
        await fetchSales();
      }
    } catch (error) {
      console.error('Failed to delete sale', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrintReceipt = (sale: any) => {
    const formattedReceipt: ReceiptData = {
      receiptNumber: sale.receiptNumber || `TH-${sale._id?.slice(-6).toUpperCase()}`,
      date: sale.date || sale.createdAt,
      cashierName: sale.cashierName || 'Cashier',
      customerName: sale.customerName || 'Walk-in Customer',
      customerPhone: sale.customerPhone || '',
      items: (sale.items || []).map((i: any) => ({
        productName: i.product?.name || i.productName || i.name || 'Item',
        size: i.size || '',
        color: i.color || '',
        qty: i.qty || 1,
        price: i.price || 0,
        subtotal: i.subtotal || (i.price || 0) * (i.qty || 1),
      })),
      subtotal: sale.subtotal || sale.totalAmount || 0,
      discount: sale.discount || 0,
      discountType: sale.discountType,
      discountValue: sale.discountValue,
      tax: sale.tax || 0,
      taxRate: sale.taxRate,
      totalAmount: sale.totalAmount || 0,
      refundAmount: sale.refundAmount || 0,
      returnStatus: sale.returnStatus,
      paymentMethod: sale.paymentMethod || 'Cash',
      cashTendered: sale.cashTendered,
      changeDue: sale.changeDue,
      easypaisaDetails: sale.easypaisaDetails,
      cardDetails: sale.cardDetails,
      bankTransferDetails: sale.bankTransferDetails,
      note: sale.note,
    };
    setReceiptData(formattedReceipt);
    setShowReceiptModal(true);
  };

  const filteredSales = salesList.filter(sale => {
    const saleDate = new Date(sale.date || sale.createdAt);
    const pkDateStr = formatPKDate(saleDate);
    const pkTimeStr = formatPKTime(saleDate);

    // Search query matching
    const matchesSearch = !searchQuery.trim() ||
      sale.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkDateStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkTimeStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      saleDate.toLocaleDateString().includes(searchQuery) ||
      sale.items?.some((i: any) => (i.product?.name || i.productName || i.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Date picker filter (using Pakistan Standard Time date string YYYY-MM-DD)
    if (selectedDate) {
      const saleDateStr = getPKCurrentDate(saleDate);
      if (saleDateStr !== selectedDate) return false;
    }

    // Period filter (7, 15, 30 days)
    if (periodFilter !== 'all') {
      const days = parseInt(periodFilter, 10);
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      if (saleDate < cutoff) return false;
    }

    return true;
  });

  const totalAmount = filteredSales.reduce((acc, sale) => {
    return acc + (sale.totalAmount || 0);
  }, 0);

  const totalItemsCount = filteredSales.reduce((acc, sale) => {
    return acc + (sale.items?.reduce((iAcc: number, item: any) => iAcc + (item.qty || 0), 0) || 0);
  }, 0);

  const avgSaleValue = filteredSales.length > 0 ? Math.round(totalAmount / filteredSales.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('sales.title', 'Sales History')}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
            Showing {filteredSales.length} {filteredSales.length === 1 ? 'sale' : 'sales'} • Total: Rs. {totalAmount.toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-48 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, item, time..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-white"
            />
          </div>

          {/* Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                if (e.target.value) setPeriodFilter('all');
              }}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
            />
          </div>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-brand-800 hover:text-brand-900 font-medium underline cursor-pointer"
            >
              Clear Date
            </button>
          )}

          {/* VIEW MODE TOGGLE (CARDS vs TABLE) */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleSetViewMode('cards')}
              className={clsx(
                'px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-brand-900 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              )}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('table')}
              className={clsx(
                'px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-brand-900 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              )}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Add Sale Button */}
          <Link to="/sales/add">
            <Button variant="primary" className="gap-2">
              <Plus className="w-4 h-4" />
              {t('dashboard.newSale', 'New Sale')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Period Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Period:</span>
          {(['all', '7', '15', '30'] as const).map((p) => {
            const label = p === 'all' ? 'All Time' : p === '7' ? 'Last 7 Days' : p === '15' ? 'Last 15 Days' : 'Last 30 Days';
            const isActive = periodFilter === p && !selectedDate;
            return (
              <button
                key={p}
                onClick={() => {
                  setPeriodFilter(p);
                  setSelectedDate('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-900 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* View Mode Indicator */}
        <div className="text-xs text-gray-400 dark:text-slate-500">
          Viewing in <span className="font-semibold text-gray-700 dark:text-slate-300 capitalize">{viewMode} Mode</span>
        </div>
      </div>

      {/* KPI METRIC CARDS BANNER */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-mono">
              Rs. {totalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Sales</p>
            <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-mono">
              {filteredSales.length} Orders
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Items Sold</p>
            <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-mono">
              {totalItemsCount} Pieces
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Avg Order Value</p>
            <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-mono">
              Rs. {avgSaleValue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Loading & Empty State */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Loading sales records...</p>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 mb-3">
            <Receipt className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No sales found</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mb-4">
            {searchQuery || selectedDate || periodFilter !== 'all'
              ? 'No sales match your current search and period filters. Try resetting filters.'
              : 'You have not recorded any sales yet. Click "+ New Sale" to add your first transaction.'}
          </p>
          {searchQuery || selectedDate || periodFilter !== 'all' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedDate('');
                setPeriodFilter('all');
              }}
              className="text-xs"
            >
              Clear Filters
            </Button>
          ) : (
            <Link to="/sales/add">
              <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                <Plus className="w-4 h-4" />
                Add First Sale
              </Button>
            </Link>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* ========================================================================= */
        /* OPTION 1: MODERN SALES CARDS GRID                                        */
        /* ========================================================================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredSales.map((sale) => {
            const saleDate = new Date(sale.date || sale.createdAt);
            const totalQty = sale.items?.reduce((acc: number, it: any) => acc + (it.qty || 1), 0) || 0;
            const customerInitial = (sale.customerName || 'W').trim().charAt(0).toUpperCase();

            return (
              <div
                key={sale._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 p-5 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Decorative Accent Top Border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-brand-800" />

                <div>
                  {/* Top Bar: Receipt # and Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                        #{sale.receiptNumber || sale._id.slice(-6).toUpperCase()}
                      </span>
                      <span
                        className={clsx(
                          'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border',
                          sale.paymentMethod?.toLowerCase().includes('easy') || sale.paymentMethod?.toLowerCase().includes('jazz')
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                            : sale.paymentMethod?.toLowerCase().includes('card')
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        )}
                      >
                        {sale.paymentMethod || 'Cash'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handlePrintReceipt(sale)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Print / View Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(sale._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Delete Sale"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex items-center gap-2.5 mb-3.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-900 to-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {customerInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {sale.customerName || t('sales.walkIn', 'Walk-in Customer')}
                      </h4>
                      <p className="text-[11px] text-gray-400 truncate font-mono">
                        {sale.customerPhone || 'Walk-in Sale'}
                      </p>
                    </div>
                  </div>

                  {/* Amount Badge */}
                  <div className="p-3 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:from-slate-800/80 dark:to-slate-800/40 rounded-xl border border-emerald-100 dark:border-slate-700/80 mb-3.5 flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Total Bill</span>
                    <span className="text-xl font-black text-emerald-800 dark:text-emerald-400 font-mono tracking-tight">
                      Rs. {sale.totalAmount?.toLocaleString()}
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 pb-3 mb-3 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formatPKDate(saleDate)}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-brand-800 dark:text-emerald-400 bg-brand-50/70 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-brand-100 dark:border-slate-700">
                      <Clock className="w-3 h-3 text-brand-700 dark:text-emerald-400" />
                      <span>{formatPKTime(saleDate)}</span>
                    </div>
                  </div>

                  {/* Items List Breakdown */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      <span>Products ({sale.items?.length || 0})</span>
                      <span className="font-mono text-gray-600 dark:text-slate-300 font-semibold">{totalQty} Total Qty</span>
                    </div>
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {sale.items?.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/70 text-gray-700 dark:text-slate-300 border border-gray-100/60 dark:border-slate-800"
                        >
                          <span className="truncate max-w-[160px] font-medium" title={item.product?.name || item.productName || item.name}>
                            {item.product?.name || item.productName || item.name || 'Clothing Item'}
                            {item.size ? ` (${item.size})` : ''}
                          </span>
                          <span className="font-mono font-bold text-gray-900 dark:text-white shrink-0 ml-2">
                            ×{item.qty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintReceipt(sale)}
                  className="w-full gap-2 text-xs font-bold border-gray-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  View & Print Receipt
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* OPTION 2: CLASSIC TABLE VIEW                                              */
        /* ========================================================================= */
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[840px]">
                {/* Table Header */}
                <div className="grid grid-cols-12 p-4 border-b border-gray-100 bg-gray-50/60 dark:bg-slate-800/50 font-semibold text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  <div className="col-span-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{t('sales.date', 'Date')}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-emerald-400" />
                    <span>{t('sales.time', 'Time')} (PKT)</span>
                  </div>
                  <div className="col-span-2">{t('sales.customer', 'Customer')}</div>
                  <div className="col-span-2">{t('nav.products', 'Product')}</div>
                  <div className="col-span-1 text-center">{t('sales.qty', 'Qty')}</div>
                  <div className="col-span-2 text-right">{t('sales.amount', 'Amount')}</div>
                  <div className="col-span-1 text-center">{t('common.action', 'Action')}</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredSales.map((sale) => (
                    <div key={sale._id} className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/80 dark:hover:bg-slate-800/60 transition-colors">
                      {/* Date */}
                      <div className="col-span-2 text-sm font-medium text-gray-900 dark:text-white">
                        {formatPKDate(sale.date || sale.createdAt)}
                      </div>

                      {/* Time */}
                      <div className="col-span-2 text-sm">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-brand-50 text-brand-800 dark:bg-slate-800 dark:text-emerald-400 border border-brand-100 dark:border-slate-700">
                          <Clock className="w-3 h-3 text-brand-700 dark:text-emerald-400" />
                          {formatPKTime(sale.date || sale.createdAt)}
                        </span>
                      </div>

                      {/* Customer */}
                      <div className="col-span-2 text-sm text-gray-700 dark:text-slate-200 truncate font-medium">
                        {sale.customerName || t('sales.walkIn', 'Walk-in Customer')}
                      </div>

                      {/* Products */}
                      <div className="col-span-2 text-sm text-gray-600 dark:text-slate-400 truncate" title={sale.items?.map((i: any) => i.product?.name || i.productName || i.name).join(', ')}>
                        {sale.items?.map((i: any) => i.product?.name || i.productName || i.name).join(', ')}
                      </div>

                      {/* Qty */}
                      <div className="col-span-1 text-sm text-gray-700 dark:text-slate-200 text-center font-semibold">
                        {sale.items?.reduce((acc: number, item: any) => acc + item.qty, 0)}
                      </div>

                      {/* Amount */}
                      <div className="col-span-2 text-sm font-bold text-gray-900 dark:text-white text-right font-mono">
                        Rs. {sale.totalAmount?.toLocaleString()}
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(sale)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(sale._id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Delete Sale"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/60 dark:bg-slate-800/40 rounded-b-2xl">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">Total Sales</div>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    Rs. {totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* THERMAL RECEIPT MODAL */}
      {showReceiptModal && receiptData && (
        <ThermalReceipt
          receipt={receiptData}
          onClose={() => {
            setShowReceiptModal(false);
            setReceiptData(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border border-gray-100 dark:border-slate-800">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Sale?</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
              This will restore the product stock and reverse customer stats.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 !bg-red-600 hover:!bg-red-700 text-white font-bold"
                onClick={handleDeleteSale}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
