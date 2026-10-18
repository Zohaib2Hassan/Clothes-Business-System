import { 
  Search, 
  Plus, 
  Home, 
  Users, 
  Zap, 
  Truck, 
  Megaphone, 
  Trash2, 
  X, 
  DollarSign, 
  LayoutGrid, 
  List, 
  Calendar, 
  Receipt 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { authFetch } from '../../utils/api';
import clsx from 'clsx';

const categoryIcons: Record<string, any> = {
  Rent: Home,
  Electricity: Zap,
  Salaries: Users,
  Transport: Truck,
  Marketing: Megaphone,
  Other: DollarSign,
};

const categoryThemes: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  Rent: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
  },
  Electricity: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/60',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
  },
  Salaries: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800/60',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
  },
  Transport: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800/60',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
  },
  Marketing: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800/60',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
  },
  Other: {
    bg: 'bg-slate-50 dark:bg-slate-900',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-800',
    badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
  },
};

const filters = ['All', 'Rent', 'Salaries', 'Electricity', 'Transport', 'Marketing'];
const categories = ['Rent', 'Electricity', 'Salaries', 'Transport', 'Marketing', 'Other'];

export default function Expenses() {
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalAmount: 0, totalCount: 0, categoryBreakdown: {} });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState('All');
  const [periodFilter, setPeriodFilter] = useState<'all' | '7' | '15' | '30'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Other');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeFilter !== 'All') params.append('category', activeFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (periodFilter !== 'all') {
        const days = parseInt(periodFilter, 10);
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        params.append('startDate', startDate);
      }
      
      const response = await authFetch(`/api/expenses?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setExpensesList(Array.isArray(data.expenses) ? data.expenses : []);
        setSummary(data.summary || { totalAmount: 0, totalCount: 0, categoryBreakdown: {} });
      }
    } catch (error) {
      console.error('Failed to fetch expenses', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [activeFilter, periodFilter]);

  const handleSearch = () => {
    fetchExpenses();
  };

  const handleOpenAddModal = () => {
    setName('');
    setCategory('Other');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setFormError('');
    setShowAddModal(true);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter the expense name.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const response = await authFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          category,
          amount: Number(amount),
          date,
          note: note.trim(),
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        await fetchExpenses();
      } else {
        const err = await response.json().catch(() => ({}));
        setFormError(err.message || 'Failed to save expense.');
      }
    } catch (error) {
      console.error('Failed to create expense', error);
      setFormError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const response = await authFetch(`/api/expenses/${deleteId}`, { method: 'DELETE' });
      if (response.ok) {
        setDeleteId(null);
        await fetchExpenses();
      }
    } catch (error) {
      console.error('Failed to delete expense', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Expenses</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
            Total: <span className="font-bold text-gray-900 dark:text-white">Rs. {summary.totalAmount?.toLocaleString() || 0}</span> across {summary.totalCount || 0} entries
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle (Matches Products.tsx) */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-brand-800 dark:text-brand-400 shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              )}
              title="Grid View (Cards)"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-800 text-brand-800 dark:text-brand-400 shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              )}
              title="List View (Rows)"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">List</span>
            </button>
          </div>

          <Button className="gap-2" onClick={handleOpenAddModal}>
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Filters: Category and Period */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer",
                activeFilter === filter
                  ? "bg-brand-800 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Right side: Search and Period */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search expenses..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder-gray-400"
            />
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-800 self-start sm:self-auto">
            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider px-2">Period:</span>
            {(['all', '7', '15', '30'] as const).map((p) => {
              const label = p === 'all' ? 'All' : p === '7' ? '7 Days' : p === '15' ? '15 Days' : '30 Days';
              const isActive = periodFilter === p;
              return (
                <button
                  key={p}
                  onClick={() => setPeriodFilter(p)}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    isActive
                      ? "bg-white dark:bg-slate-800 text-brand-800 dark:text-brand-400 shadow-xs"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content: Loading, Empty, Grid (Cards), or List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-gray-100 dark:bg-slate-900 animate-pulse border border-gray-200 dark:border-slate-800" />
          ))}
        </div>
      ) : expensesList.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-900 flex items-center justify-center text-gray-400 mb-3">
            <Receipt className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base">No Expenses Found</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-sm">
            {searchQuery || activeFilter !== 'All'
              ? 'No expense entries match your current search or category filter.'
              : 'You haven\'t recorded any expenses yet. Click "Add Expense" to track rent, salaries, electricity, and more.'}
          </p>
          <Button size="sm" className="mt-4 gap-2" onClick={handleOpenAddModal}>
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* MODERN EXPENSE CARDS GRID (Matches Products.tsx card aesthetics) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {expensesList.map((expense) => {
            const IconComp = categoryIcons[expense.category] || DollarSign;
            const theme = categoryThemes[expense.category] || categoryThemes.Other;

            return (
              <div
                key={expense._id}
                className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-200/90 dark:border-slate-800/90 hover:border-brand-500/80 dark:hover:border-brand-500/80 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-between overflow-hidden group relative"
              >
                {/* Card Top & Details */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5">
                  {/* Category Pill & Date */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={clsx(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider",
                      theme.badge
                    )}>
                      <IconComp className="w-3.5 h-3.5" />
                      {expense.category || 'Other'}
                    </span>

                    <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400 flex items-center gap-1 bg-gray-50 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-gray-100 dark:border-slate-800">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {new Date(expense.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3 my-1">
                    <div className={clsx(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105",
                      theme.bg, theme.text, theme.border
                    )}>
                      <IconComp className="w-6 h-6 stroke-[1.8]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-1 group-hover:text-brand-800 dark:group-hover:text-brand-400 transition-colors"
                        title={expense.name}
                      >
                        {expense.name}
                      </h3>
                      {expense.note ? (
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2 italic" title={expense.note}>
                          "{expense.note}"
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                          Standard business expense
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Amount & Delete Action */}
                <div className="px-4 sm:px-5 py-3 bg-gray-50/70 dark:bg-slate-900/60 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 block tracking-wider -mb-0.5">
                      Amount
                    </span>
                    <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                      Rs. {expense.amount?.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => setDeleteId(expense._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all cursor-pointer"
                    title="Delete Expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {expensesList.map((expense) => {
                const IconComp = categoryIcons[expense.category] || DollarSign;
                const theme = categoryThemes[expense.category] || categoryThemes.Other;

                return (
                  <div key={expense._id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={clsx("w-11 h-11 rounded-xl flex items-center justify-center border", theme.bg, theme.text, theme.border)}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-white">{expense.name}</h3>
                          <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase", theme.badge)}>
                            {expense.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          {new Date(expense.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {expense.note && <span className="ml-2 text-gray-400">• {expense.note}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-gray-900 dark:text-white text-base">
                        Rs. {expense.amount?.toLocaleString()}
                      </span>
                      <button
                        onClick={() => setDeleteId(expense._id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Add New Expense</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expense Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  placeholder="e.g. Shop Rent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    placeholder="25000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  placeholder="e.g. September payment"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Expense'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Expense?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 !bg-red-600 hover:!bg-red-700"
                onClick={handleDeleteExpense}
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
