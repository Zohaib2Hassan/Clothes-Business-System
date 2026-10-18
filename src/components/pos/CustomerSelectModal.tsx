import { useState, useEffect } from 'react';
import { Search, User, UserPlus, Check, X, Phone, ShoppingBag, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { authFetch } from '../../utils/api';
import clsx from 'clsx';

export interface CustomerData {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  totalSpent?: number;
  totalOrders?: number;
}

interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: CustomerData | null) => void;
  selectedCustomerId?: string;
}

export default function CustomerSelectModal({
  isOpen,
  onClose,
  onSelectCustomer,
  selectedCustomerId,
}: CustomerSelectModalProps) {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCustomers = async (query = '') => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const url = query.trim() ? `/api/customers?search=${encodeURIComponent(query.trim())}` : '/api/customers';
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
      setErrorMsg('Failed to load customers from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomers(searchQuery);
    }
  }, [isOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchQuery);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErrorMsg('Customer name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await authFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim(),
          email: newEmail.trim(),
          address: newAddress.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create customer');
      }

      const created = await res.json();
      onSelectCustomer(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Customer Selection</h3>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">Link purchase to customer profile</p>
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

        {/* Tab Toggle: Select vs Quick Add */}
        <div className="px-4 pt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setIsAddingNew(false)}
            className={clsx(
              'flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer',
              !isAddingNew
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-800'
            )}
          >
            Search Existing ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className={clsx(
              'flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5',
              isAddingNew
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-800'
            )}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Quick Add Customer</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isAddingNew ? (
            /* Quick Add Customer Form */
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ahmed Raza"
                  className="w-full text-xs font-bold px-3 py-2 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 0300-1234567"
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full text-xs px-3 py-2 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">
                  City / Address
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Lahore, Pakistan"
                  className="w-full text-xs px-3 py-2 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingNew(false)}
                  className="flex-1 text-xs py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="flex-1 text-xs py-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Select Customer'}
                </Button>
              </div>
            </form>
          ) : (
            /* Search & List */
            <>
              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    fetchCustomers(e.target.value);
                  }}
                  placeholder="Search customer by name, phone (0300...)"
                  className="w-full pl-9 pr-8 py-2 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      fetchCustomers('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* 1-Click Walk-in Option */}
              <div
                onClick={() => {
                  onSelectCustomer(null);
                  onClose();
                }}
                className={clsx(
                  'p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between',
                  !selectedCustomerId
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-gray-300'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-slate-800 flex items-center justify-center font-bold text-gray-700 dark:text-slate-300">
                    W
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Walk-in Customer</h4>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">Standard counter retail purchase</p>
                  </div>
                </div>
                {!selectedCustomerId && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              </div>

              {/* Customers List from MongoDB */}
              {isLoading && customers.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
                  <span className="text-xs">Loading customers...</span>
                </div>
              ) : customers.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  No customers found matching "{searchQuery}".
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(true)}
                    className="block mx-auto mt-2 text-emerald-600 dark:text-emerald-400 font-bold underline"
                  >
                    + Add "{searchQuery}" as new customer
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {customers.map((c) => {
                    const isSelected = selectedCustomerId === c._id;
                    const isVIP = (c.totalSpent || 0) >= 20000;
                    return (
                      <div
                        key={c._id}
                        onClick={() => {
                          onSelectCustomer(c);
                          onClose();
                        }}
                        className={clsx(
                          'p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between',
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-emerald-500/70 hover:bg-gray-50/50 dark:hover:bg-slate-900/80'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold truncate text-gray-900 dark:text-white">{c.name}</h4>
                              {isVIP && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5" /> VIP
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
                              {c.phone && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone className="w-2.5 h-2.5 text-gray-400" />
                                  {c.phone}
                                </span>
                              )}
                              <span className="flex items-center gap-1 font-mono">
                                <ShoppingBag className="w-2.5 h-2.5 text-gray-400" />
                                {c.totalOrders || 0} orders (Rs. {(c.totalSpent || 0).toLocaleString()})
                              </span>
                            </div>
                          </div>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
