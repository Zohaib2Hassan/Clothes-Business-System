import { 
  Search, 
  Plus, 
  ChevronRight, 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  RefreshCw,
  LayoutGrid,
  List,
  ShoppingBag,
  Crown,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { authFetch } from '../../utils/api';
import clsx from 'clsx';

const avatarThemes = [
  { bg: 'from-emerald-500/15 to-teal-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' },
  { bg: 'from-blue-500/15 to-indigo-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60' },
  { bg: 'from-purple-500/15 to-pink-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60' },
  { bg: 'from-amber-500/15 to-orange-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' },
  { bg: 'from-rose-500/15 to-red-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60' },
  { bg: 'from-cyan-500/15 to-sky-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60' },
];

export default function Customers() {
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'vip' | 'repeat' | 'new'>('all');
  
  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  // New customer form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomersList(Array.isArray(data) ? data : []);
      } else if (response.status === 401) {
        console.warn('Unauthorized when fetching customers');
      }
    } catch (error) {
      console.error('Failed to fetch customers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenAddModal = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setFormError('');
    setShowAddModal(true);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter the customer name.');
      return;
    }
    
    setIsSubmitting(true);
    setFormError('');

    try {
      const response = await authFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim()
        })
      });
      
      if (response.ok) {
        setShowAddModal(false);
        setName('');
        setPhone('');
        setEmail('');
        setAddress('');
        await fetchCustomers();
      } else {
        const err = await response.json().catch(() => ({}));
        if (response.status === 401) {
          setFormError('Session expired. Please log out and log back in.');
        } else {
          setFormError(err.message || 'Failed to save customer. Please try again.');
        }
      }
    } catch (error) {
      console.error('Failed to create customer', error);
      setFormError('Network connection error. Please verify the server is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics summary
  const totalCustomers = customersList.length;
  const totalSpent = customersList.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const totalOrders = customersList.reduce((acc, c) => acc + (c.totalOrders || 0), 0);
  const vipCount = customersList.filter(c => (c.totalSpent || 0) >= 15000 || (c.totalOrders || 0) >= 2).length;

  // Filter customers by search and category
  const filteredCustomers = customersList.filter((customer) => {
    const query = searchQuery.toLowerCase().trim();
    const matchName = customer.name?.toLowerCase().includes(query);
    const matchPhone = customer.phone?.toLowerCase().includes(query);
    const matchEmail = customer.email?.toLowerCase().includes(query);
    const matchesSearch = !query || matchName || matchPhone || matchEmail;

    if (!matchesSearch) return false;

    if (filterType === 'vip') {
      return (customer.totalSpent || 0) >= 15000 || (customer.totalOrders || 0) >= 2;
    }
    if (filterType === 'repeat') {
      return (customer.totalOrders || 0) > 0;
    }
    if (filterType === 'new') {
      return (customer.totalOrders || 0) === 0;
    }
    return true;
  });

  const getAvatarTheme = (nameStr: string, idStr: string) => {
    const key = (nameStr || idStr || 'A').charCodeAt(0);
    return avatarThemes[key % avatarThemes.length];
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Customers</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
            Total: <span className="font-bold text-gray-900 dark:text-white">{totalCustomers}</span> clients &bull;{' '}
            <span className="font-bold text-gray-900 dark:text-white">Rs. {totalSpent.toLocaleString()}</span> lifetime spend
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle (Grid Cards vs List) */}
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
              <span className="hidden md:inline">Cards</span>
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
              title="List View"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">List</span>
            </button>
          </div>

          <button
            onClick={() => fetchCustomers()}
            title="Refresh customers"
            className="p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Button className="gap-2 shadow-xs" onClick={handleOpenAddModal}>
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-gray-200/90 dark:border-slate-800/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 flex items-center justify-center shrink-0 border border-brand-100 dark:border-brand-900">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">Total Clients</p>
            <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-0.5">{totalCustomers}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-gray-200/90 dark:border-slate-800/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">Total Orders</p>
            <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-0.5">{totalOrders}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-gray-200/90 dark:border-slate-800/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">Lifetime Revenue</p>
            <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-0.5">Rs. {totalSpent.toLocaleString()}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-gray-200/90 dark:border-slate-800/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900">
            <Crown className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">VIP / Repeat Buyers</p>
            <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-0.5">{vipCount}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {([
            { id: 'all', label: 'All Clients' },
            { id: 'vip', label: 'VIP Buyers' },
            { id: 'repeat', label: 'With Orders' },
            { id: 'new', label: 'New Clients' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer",
                filterType === tab.id
                  ? "bg-brand-800 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone or email..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Main Content: Loading, Empty, Grid (Cards), or List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 rounded-2xl bg-gray-100 dark:bg-slate-900 animate-pulse border border-gray-200 dark:border-slate-800" />
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-900 flex items-center justify-center text-gray-400 mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base">No Customers Found</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-sm">
            {searchQuery || filterType !== 'all'
              ? 'No customer records match your current search or filter. Try clearing your search.'
              : 'You haven\'t added any customer records yet. Click "Add Customer" to register your first buyer.'}
          </p>
          <Button size="sm" className="mt-4 gap-2" onClick={handleOpenAddModal}>
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ========================================================================= */
        /* MODERN CUSTOMER CARDS GRID (Matches Products and Expenses card aesthetics) */
        /* ========================================================================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredCustomers.map((customer) => {
            const initials = (customer.name || 'C')
              .split(' ')
              .filter(Boolean)
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'C';

            const theme = getAvatarTheme(customer.name, customer._id);
            const isVip = (customer.totalSpent || 0) >= 15000 || (customer.totalOrders || 0) >= 2;

            return (
              <div
                key={customer._id}
                className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-200/90 dark:border-slate-800/90 hover:border-brand-500/80 dark:hover:border-brand-500/80 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-between overflow-hidden group relative"
              >
                {/* Card Top & Details */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  {/* Row 1: Avatar on Left, Status Badge on Right */}
                  <div className="flex items-center justify-between">
                    <div className={clsx(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base bg-gradient-to-br border shadow-xs group-hover:scale-105 transition-transform",
                      theme.bg
                    )}>
                      {initials}
                    </div>

                    {/* Status / VIP Badge */}
                    {isVip ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shrink-0">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        VIP
                      </span>
                    ) : (customer.totalOrders || 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 shrink-0">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-medium uppercase tracking-wider bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-800 shrink-0">
                        New
                      </span>
                    )}
                  </div>

                  {/* Row 2: Customer Name & Joined Date */}
                  <div>
                    <Link 
                      to={`/customers/${customer._id}`}
                      className="font-bold text-gray-900 dark:text-white text-base leading-snug group-hover:text-brand-800 dark:group-hover:text-brand-400 transition-colors line-clamp-1 block"
                      title={customer.name}
                    >
                      {customer.name}
                    </Link>
                    <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{customer.createdAt 
                        ? `Joined ${new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` 
                        : 'Registered Client'}</span>
                    </p>
                  </div>

                  {/* Row 3: Customer Contact Details */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-slate-900 text-xs">
                    {customer.phone ? (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                        <a 
                          href={`tel:${customer.phone}`} 
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline hover:text-brand-800 dark:hover:text-brand-400 font-medium"
                        >
                          {customer.phone}
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500">
                        <Phone className="w-3.5 h-3.5 shrink-0 opacity-40" />
                        <span className="italic text-[11px]">No phone registered</span>
                      </div>
                    )}

                    {customer.email ? (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    ) : null}

                    {customer.address ? (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Card Footer: Total Spent & Link to Profile */}
                <div className="px-5 py-3.5 bg-gray-50/80 dark:bg-slate-900/70 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 block tracking-wider">
                      Total Spent
                    </span>
                    <span className="text-base font-black text-gray-900 dark:text-white">
                      Rs. {(customer.totalSpent || 0).toLocaleString()}
                    </span>
                  </div>

                  <Link
                    to={`/customers/${customer._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/60 text-xs font-bold text-gray-700 dark:text-slate-200 hover:text-brand-800 dark:hover:text-brand-400 border border-gray-200 dark:border-slate-700 shadow-2xs transition-all group-hover:border-brand-500/50"
                  >
                    <span>{customer.totalOrders || 0} Orders</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-brand-800 dark:group-hover:text-brand-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* LIST VIEW */
        /* ========================================================================= */
        <Card className="bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredCustomers.map((customer) => {
                const initials = (customer.name || 'C')
                  .split(' ')
                  .filter(Boolean)
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || 'C';

                const theme = getAvatarTheme(customer.name, customer._id);
                const isVip = (customer.totalSpent || 0) >= 15000 || (customer.totalOrders || 0) >= 2;

                return (
                  <Link 
                    key={customer._id} 
                    to={`/customers/${customer._id}`} 
                    className="p-4 sm:px-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-900/60 transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={clsx(
                        "w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm bg-gradient-to-br border shrink-0",
                        theme.bg
                      )}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-brand-800 dark:group-hover:text-brand-400 transition-colors truncate">
                            {customer.name}
                          </h3>
                          {isVip && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                              <Crown className="w-2.5 h-2.5 text-amber-500" /> VIP
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{customer.totalOrders || 0} orders</span>
                          <span>&bull;</span>
                          <span className="font-semibold text-gray-700 dark:text-slate-300">Rs. {(customer.totalSpent || 0).toLocaleString()}</span>
                          {customer.phone && (
                            <>
                              <span>&bull;</span>
                              <span className="text-gray-400">{customer.phone}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="hidden sm:inline-block text-xs font-semibold text-brand-800 dark:text-brand-400 group-hover:underline">
                        View Profile
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-800 dark:group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New Customer</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    placeholder="e.g. Ali Khan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    placeholder="e.g. 0300 1234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    placeholder="e.g. ali@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Address (Optional)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    placeholder="e.g. Liberty Market, Lahore"
                  />
                </div>
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
                  {isSubmitting ? 'Saving...' : 'Save Customer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
