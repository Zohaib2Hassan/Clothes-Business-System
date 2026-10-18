import { 
  ChevronLeft, 
  Search, 
  Plus, 
  Trash2, 
  Users, 
  UserPlus, 
  UserCheck, 
  Phone, 
  MapPin, 
  Calendar,
  X,
  User as UserIcon,
  Package,
  Tag,
  ShoppingBag,
  Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { authFetch } from '../../utils/api';
import { PRODUCT_CATEGORIES } from '../../constants/categories';
import { getPKCurrentDate, getPKCurrentTime, toPKISOString, formatPKTime } from '../../utils/date';
import clsx from 'clsx';

interface ProductItem {
  _id: string;
  productId?: string;
  name: string;
  price: number;
  stock?: number;
  category?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number | string;
  qty: number | string;
  category?: string;
  stock?: number;
  isManual?: boolean;
  saveToInventory?: boolean;
}

interface CustomerItem {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
  totalOrders?: number;
  totalSpent?: number;
}

export default function AddSale() {
  const navigate = useNavigate();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number | string>(0);
  const [productSearch, setProductSearch] = useState('');
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<CustomerItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('Paid');

  // Product Mode: 'manual' | 'inventory'
  const [productMode, setProductMode] = useState<'manual' | 'inventory'>('manual');
  const [manualProductName, setManualProductName] = useState('');
  const [manualProductPrice, setManualProductPrice] = useState<number | string>('');
  const [manualProductQty, setManualProductQty] = useState<number | string>(1);
  const [manualProductCategory, setManualProductCategory] = useState("Men's Wear");
  const [manualSaveToInventory, setManualSaveToInventory] = useState(true);

  // Customer Mode: 'existing' | 'manual' | 'walkin'
  const [customerMode, setCustomerMode] = useState<'existing' | 'manual' | 'walkin'>('manual');
  
  // Existing customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  // Manual customer entry fields
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualAddress, setManualAddress] = useState('');

  // Date and Time of sale in Pakistan Standard Time (PKT, UTC+05:00)
  const [saleDate, setSaleDate] = useState(() => getPKCurrentDate());
  const [saleTime, setSaleTime] = useState(() => getPKCurrentTime());

  const handleSetToCurrentPKT = () => {
    setSaleDate(getPKCurrentDate());
    setSaleTime(getPKCurrentTime());
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await authFetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setAvailableProducts(data);
        }
      } catch (error) {
        console.error('Failed to fetch products', error);
      }
    };
    
    const fetchCustomers = async () => {
      try {
        const response = await authFetch('/api/customers');
        if (response.ok) {
          const data = await response.json();
          setAvailableCustomers(data);
        }
      } catch (error) {
        console.error('Failed to fetch customers', error);
      }
    };

    fetchProducts();
    fetchCustomers();
  }, []);

  // When customerSearch changes in existing mode, try matching
  const handleExistingCustomerSearch = (val: string) => {
    setCustomerSearch(val);
    const matched = availableCustomers.find(
      c => c.name.toLowerCase() === val.toLowerCase() || (c.phone && c.phone === val)
    );
    setSelectedCustomer(matched || null);
  };

  const subtotal = cart.reduce((acc, item) => {
    const quantity = typeof item.qty === 'number' ? item.qty : Number(item.qty) || 0;
    const itemPrice = typeof item.price === 'number' ? item.price : Number(item.price) || 0;
    return acc + (itemPrice * quantity);
  }, 0);
  
  const total = Math.max(0, subtotal - (typeof discount === 'number' ? discount : Number(discount) || 0));

  const updateQty = (id: string, val: string) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        if (val === '') return { ...item, qty: '' };
        const parsed = parseInt(val);
        return { ...item, qty: isNaN(parsed) ? 1 : Math.max(1, parsed) };
      }
      return item;
    }));
  };

  const updatePrice = (id: string, val: string) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        if (val === '') return { ...item, price: '' as any };
        const parsed = parseFloat(val);
        return { ...item, price: isNaN(parsed) ? 0 : Math.max(0, parsed) };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const addManualProduct = () => {
    if (!manualProductName.trim()) {
      alert('Please enter product name.');
      return;
    }
    const priceNum = Number(manualProductPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid price (greater than 0).');
      return;
    }
    const qtyNum = Math.max(1, Number(manualProductQty) || 1);
    const trimmedName = manualProductName.trim();

    const existingIndex = cart.findIndex(c => c.name.toLowerCase() === trimmedName.toLowerCase());
    if (existingIndex >= 0) {
      setCart(cart.map((c, i) => i === existingIndex ? { ...c, qty: (Number(c.qty) || 1) + qtyNum } : c));
    } else {
      setCart([
        ...cart,
        {
          id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: trimmedName,
          price: priceNum,
          qty: qtyNum,
          category: manualProductCategory,
          isManual: true,
          saveToInventory: manualSaveToInventory
        }
      ]);
    }

    setManualProductName('');
    setManualProductPrice('');
    setManualProductQty(1);
  };

  const addProductToCart = () => {
    if (!productSearch.trim()) return;
    
    // Find product from available products by name or productId
    const searchVal = productSearch.trim().toLowerCase();
    const selectedProduct = availableProducts.find(
      p => p.name.toLowerCase() === searchVal ||
           (p.productId && p.productId.toLowerCase() === searchVal) ||
           `[${p.productId}] ${p.name}`.toLowerCase() === searchVal
    );
    
    if (selectedProduct) {
      // Check if already in cart
      const existing = cart.find(c => c.id === selectedProduct._id);
      if (existing) {
        setCart(cart.map(c => 
          c.id === selectedProduct._id ? { ...c, qty: (Number(c.qty) || 1) + 1 } : c
        ));
      } else {
        setCart([...cart, { 
          id: selectedProduct._id, 
          name: selectedProduct.name, 
          price: selectedProduct.price, 
          qty: 1,
          category: selectedProduct.category,
          stock: selectedProduct.stock,
          isManual: false
        }]);
      }
      setProductSearch('');
    } else {
      // If not found in inventory, auto-switch to manual mode with prefilled name!
      setManualProductName(productSearch.trim());
      setProductMode('manual');
      setProductSearch('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Please add at least one product to the sale.');
      return;
    }

    // Customer validation based on mode
    let customerId: string | undefined = undefined;
    let customerName = 'Walk-in Customer';
    let customerPhone = '';
    let customerAddress = '';

    if (customerMode === 'manual') {
      if (!manualName.trim()) {
        alert('Please enter the customer name.');
        return;
      }
      customerName = manualName.trim();
      customerPhone = manualPhone.trim();
      customerAddress = manualAddress.trim();
    } else if (customerMode === 'existing') {
      if (selectedCustomer) {
        customerId = selectedCustomer._id;
        customerName = selectedCustomer.name;
        customerPhone = selectedCustomer.phone || '';
      } else if (customerSearch.trim()) {
        customerName = customerSearch.trim();
      }
    } else {
      // Walk-in
      customerName = 'Walk-in Customer';
    }

    setIsSubmitting(true);

    try {
      const finalSaleDate = toPKISOString(saleDate, saleTime);
      const response = await authFetch('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          customerName,
          customerPhone,
          customerAddress,
          date: finalSaleDate,
          items: cart.map(item => ({
            product: item.isManual ? undefined : item.id,
            name: item.name,
            productName: item.name,
            category: item.category || 'Clothing',
            qty: Number(item.qty) || 1,
            price: Number(item.price) || 0,
            saveToInventory: item.saveToInventory ?? true,
          })),
          subtotal,
          discount: typeof discount === 'number' ? discount : 0,
          totalAmount: total,
          paymentStatus
        })
      });

      if (response.ok) {
        window.dispatchEvent(new CustomEvent('notifications:refresh'));
        navigate('/sales');
      } else {
        const err = await response.json();
        alert('Failed to save sale: ' + (err.message || 'Error occurred'));
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while saving the sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/sales" className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add Sale</h1>
          <p className="text-gray-500 text-sm mt-1">Record a new sales transaction with manual or existing customer.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SALE DATE & TIME CARD (PKT) */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-800" />
              <div>
                <CardTitle>Sale Date & Time</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">Pakistan Standard Time (PKT, UTC+05:00)</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSetToCurrentPKT}
              className="text-xs font-semibold text-brand-800 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Clock className="w-3.5 h-3.5 text-brand-700" />
              <span>Set to Current PK Time</span>
            </button>
          </CardHeader>

          <CardContent className="pt-5 pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Sale Date
                </label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Sale Time</span>
                  <span className="text-[11px] font-mono text-brand-800 font-semibold">
                    {formatPKTime(toPKISOString(saleDate, saleTime), false)}
                  </span>
                </label>
                <input
                  type="time"
                  value={saleTime}
                  onChange={(e) => setSaleTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium cursor-pointer"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CUSTOMER DETAILS CARD */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-800" />
              <CardTitle>Customer Details</CardTitle>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex bg-gray-200/70 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCustomerMode('manual')}
                className={clsx(
                  "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer",
                  customerMode === 'manual'
                    ? "bg-white text-brand-800 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Manually
              </button>

              <button
                type="button"
                onClick={() => setCustomerMode('existing')}
                className={clsx(
                  "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer",
                  customerMode === 'existing'
                    ? "bg-white text-brand-800 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Users className="w-3.5 h-3.5" />
                Select Existing
              </button>

              <button
                type="button"
                onClick={() => setCustomerMode('walkin')}
                className={clsx(
                  "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer",
                  customerMode === 'walkin'
                    ? "bg-white text-brand-800 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Walk-in
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-5">
            {/* OPTION 1: ADD MANUALLY */}
            {customerMode === 'manual' && (
              <div className="space-y-4">
                <div className="p-3 bg-brand-50/50 border border-brand-100 rounded-xl flex items-center justify-between text-xs text-brand-800">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-brand-800 shrink-0" />
                    <span>Enter customer details manually. They will automatically be saved to your customer directory.</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setCustomerMode('existing')}
                    className="text-xs font-semibold underline hover:text-brand-900 shrink-0 ml-2"
                  >
                    Select Existing
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="e.g. Usman Ali"
                        required={customerMode === 'manual'}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900 font-medium"
                      />
                    </div>
                  </div>

                  {/* Customer Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-gray-400 text-xs">(Recommended)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        placeholder="+92 300 1234567"
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City / Address <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        placeholder="e.g. Lahore / DHA Phase 5"
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Date of Sale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Sale
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="date" 
                        value={saleDate}
                        onChange={(e) => setSaleDate(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OPTION 2: SELECT EXISTING CUSTOMER */}
            {customerMode === 'existing' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Select Customer</label>
                      <button
                        type="button"
                        onClick={() => setCustomerMode('manual')}
                        className="text-xs font-semibold text-brand-800 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Manually Instead
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        list="customers-list"
                        value={customerSearch}
                        onChange={(e) => handleExistingCustomerSearch(e.target.value)}
                        placeholder="Search existing customer name or phone..."
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                      />
                      <datalist id="customers-list">
                        {availableCustomers.map(c => (
                          <option key={c._id} value={c.name}>
                            {c.phone ? `${c.name} (${c.phone})` : c.name}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    {/* Selected Customer Chip */}
                    {selectedCustomer && (
                      <div className="mt-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-emerald-900">{selectedCustomer.name}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                              {selectedCustomer.totalOrders || 0} orders
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            {selectedCustomer.phone || 'No phone'} • Spent: Rs. {(selectedCustomer.totalSpent || 0).toLocaleString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(null);
                            setCustomerSearch('');
                          }}
                          className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition-colors"
                          title="Remove selection"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Date of Sale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Sale</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="date" 
                        value={saleDate}
                        onChange={(e) => setSaleDate(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OPTION 3: WALK-IN CUSTOMER */}
            {customerMode === 'walkin' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-800 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Walk-in Customer</p>
                    <p className="text-xs text-gray-500">Quick counter sale without customer registration.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Sale</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="date" 
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PRODUCTS CARD */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-800" />
              <CardTitle>Add Products to Sale</CardTitle>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center bg-gray-200/70 p-1 rounded-xl gap-1 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setProductMode('manual')}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  productMode === 'manual'
                    ? "bg-white text-brand-800 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Manually
              </button>

              <button
                type="button"
                onClick={() => setProductMode('inventory')}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  productMode === 'inventory'
                    ? "bg-white text-brand-800 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Search className="w-3.5 h-3.5" />
                Select from Inventory
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-5">
            {/* OPTION 1: ADD PRODUCT MANUALLY */}
            {productMode === 'manual' && (
              <div className="p-4 bg-brand-50/30 border border-brand-100 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Product Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        value={manualProductName}
                        onChange={(e) => setManualProductName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManualProduct())}
                        placeholder="e.g. Lawn Embroidered Kurti"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Price (Rs) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="number" 
                        value={manualProductPrice}
                        onChange={(e) => setManualProductPrice(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManualProduct())}
                        placeholder="e.g. 2500"
                        min="1"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Qty
                    </label>
                    <input 
                      type="number" 
                      value={manualProductQty}
                      onChange={(e) => setManualProductQty(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManualProduct())}
                      min="1"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  {/* Category & Save to Inventory Checkbox */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 font-medium">Category:</label>
                      <select 
                        value={manualProductCategory}
                        onChange={(e) => setManualProductCategory(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-brand-500"
                      >
                        <optgroup label="Clothing Categories">
                          {PRODUCT_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </optgroup>
                        <optgroup label="General / Other">
                          <option value="Men's Wear">Men's Wear</option>
                          <option value="Women's Wear">Women's Wear</option>
                          <option value="Kids Wear">Kids Wear</option>
                          <option value="Footwear">Footwear</option>
                          <option value="General">General</option>
                        </optgroup>
                      </select>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={manualSaveToInventory}
                        onChange={(e) => setManualSaveToInventory(e.target.checked)}
                        className="rounded border-gray-300 text-brand-800 focus:ring-brand-500"
                      />
                      <span>Save product to inventory automatically</span>
                    </label>
                  </div>

                  {/* Add button */}
                  <Button 
                    type="button" 
                    onClick={addManualProduct}
                    variant="primary" 
                    className="gap-2 py-2 px-4 text-xs font-semibold shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product to Sale
                  </Button>
                </div>
              </div>
            )}

            {/* OPTION 2: SELECT FROM EXISTING INVENTORY */}
            {productMode === 'inventory' && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      list="products-list"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProductToCart())}
                      placeholder="Search existing products by name or Product ID..."
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                    />
                    <datalist id="products-list">
                      {availableProducts.map((p) => (
                        <option key={p._id} value={p.productId || p.name}>
                          {p.productId ? `[${p.productId}] ` : ''}{p.name} - Rs. {p.price.toLocaleString()} ({p.stock || 0} in stock)
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <Button type="button" onClick={addProductToCart} variant="outline" className="gap-2 shrink-0">
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                  <span>Showing {availableProducts.length} items from your inventory</span>
                  <button
                    type="button"
                    onClick={() => setProductMode('manual')}
                    className="text-brand-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Can't find item? Add Manually
                  </button>
                </div>
              </div>
            )}

            {/* CART TABLE */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Price (Rs)</th>
                    <th className="px-4 py-3 text-right">Total (Rs)</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {cart.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{item.name}</span>
                          {item.isManual ? (
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                              Manual
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                              Stock ({item.stock ?? '✓'})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {item.category || 'General'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="number" 
                          value={item.qty} 
                          onChange={(e) => updateQty(item.id, e.target.value)}
                          min="1"
                          className="w-16 p-1 text-center border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-500 text-gray-900 font-medium" 
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input 
                          type="number" 
                          value={item.price} 
                          onChange={(e) => updatePrice(item.id, e.target.value)}
                          min="0"
                          className="w-24 p-1 text-right border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-500 text-gray-900 font-medium" 
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        Rs. {((Number(item.price) || 0) * (Number(item.qty) || 0)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.preventDefault();
                            removeItem(item.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer relative z-10"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <ShoppingBag className="w-8 h-8 mb-2 stroke-[1.5] text-gray-300" />
                          <p className="text-sm font-medium text-gray-600">No products added to the sale yet.</p>
                          <p className="text-xs text-gray-400 mt-1">Use the "Add Manually" form or "Select from Inventory" above to add products.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* PAYMENT & SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <select 
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
              >
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">Rs {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-500">Discount (Rs)</span>
                <input 
                  type="number" 
                  value={discount} 
                  onChange={(e) => setDiscount(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 p-1 text-right border border-gray-200 rounded-md bg-gray-50 text-sm focus:outline-none focus:border-brand-500 text-gray-900" 
                />
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-brand-800 text-lg">Rs {total.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SUBMIT BUTTONS */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Link to="/sales">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" variant="primary" disabled={isSubmitting || cart.length === 0}>
            {isSubmitting ? 'Recording Sale...' : 'Complete Sale'}
          </Button>
        </div>
      </form>
    </div>
  );
}
