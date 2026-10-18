import { ChevronLeft, Edit2, Mail, Phone, MapPin, ExternalLink, X, User } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { authFetch } from '../../utils/api';
import clsx from 'clsx';

export default function CustomerProfile() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const [customerRes, salesRes] = await Promise.all([
        authFetch(`/api/customers/${id}`),
        authFetch(`/api/sales?customerId=${id}`)
      ]);

      if (customerRes.ok) {
        const data = await customerRes.json();
        setCustomer(data);
        setEditName(data.name || '');
        setEditPhone(data.phone || '');
        setEditEmail(data.email || '');
        setEditAddress(data.address || '');
      }

      if (salesRes.ok) {
        const data = await salesRes.json();
        setPurchaseHistory(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch customer data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCustomerData();
  }, [id]);

  const handleOpenEdit = () => {
    if (customer) {
      setEditName(customer.name || '');
      setEditPhone(customer.phone || '');
      setEditEmail(customer.email || '');
      setEditAddress(customer.address || '');
      setEditError('');
      setShowEditModal(true);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError('Customer name cannot be empty.');
      return;
    }

    setIsUpdating(true);
    setEditError('');

    try {
      const response = await authFetch(`/api/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim(),
          address: editAddress.trim()
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setCustomer((prev: any) => ({ ...prev, ...updated }));
        setShowEditModal(false);
      } else {
        const err = await response.json().catch(() => ({}));
        setEditError(err.message || 'Failed to update customer details.');
      }
    } catch (error) {
      console.error('Error updating customer', error);
      setEditError('Network error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading customer profile...</div>;
  }

  if (!customer) {
    return (
      <div className="space-y-4 p-8 text-center">
        <p className="text-gray-500">Customer not found.</p>
        <Link to="/customers">
          <Button variant="outline">Back to Customers</Button>
        </Link>
      </div>
    );
  }

  const initials = (customer.name || 'C')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/customers" className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Details</h1>
          <p className="text-gray-500 text-sm mt-1">View customer information and purchase history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left Column: Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center text-2xl font-bold text-brand-800 mb-4 border border-brand-100">
                {initials}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
              
              <div className="w-full space-y-4 mt-6 text-left">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{customer.phone || 'No phone number'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{customer.email || 'No email address'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{customer.address || 'No address provided'}</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Purchases</p>
                  <p className="font-bold text-gray-900 text-lg">{customer.totalOrders || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Spent</p>
                  <p className="font-bold text-brand-800 text-lg">Rs. {(customer.totalSpent || 0).toLocaleString()}</p>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-6 gap-2"
                onClick={handleOpenEdit}
              >
                <Edit2 className="w-4 h-4" />
                Edit Customer
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                <div className="grid grid-cols-4 p-4 bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                  <div>Order ID</div>
                  <div>Date</div>
                  <div className="text-right">Amount</div>
                  <div className="text-right">Status</div>
                </div>
                {purchaseHistory.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No purchase history yet.</div>
                ) : (
                  purchaseHistory.map((order) => (
                    <div key={order._id} className="grid grid-cols-4 p-4 items-center hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {order._id.substring(order._id.length - 6).toUpperCase()}
                        </span>
                        <ExternalLink className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-900" />
                      </div>
                      <div className="text-sm text-gray-600">{new Date(order.date || order.createdAt).toLocaleDateString()}</div>
                      <div className="text-sm font-semibold text-gray-900 text-right">Rs. {(order.totalAmount || 0).toLocaleString()}</div>
                      <div className="text-right">
                        <span className={clsx(
                          "text-[10px] font-bold px-2 py-1 rounded-md",
                          order.paymentStatus === 'Paid' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                        )}>
                          {order.paymentStatus || 'Paid'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Edit Customer</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateCustomer} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="flex-1"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
