import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  Store,
  X,
  AlertCircle,
  User,
  RefreshCw,
  Tag,
  Maximize2,
  Minimize2,
  LayoutGrid,
  List,
  Clock,
  Receipt,
  ShoppingBag,
  Shirt,
  Sparkles,
  PauseCircle,
  RotateCcw,
  History,
  Percent,
  PackagePlus,
  Smartphone,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../utils/api';
import clsx from 'clsx';
import ThermalReceipt, { type ReceiptData } from '../../components/pos/ThermalReceipt';
import CustomerSelectModal, { type CustomerData } from '../../components/pos/CustomerSelectModal';
import HeldSalesModal, { type HeldSaleRecord } from '../../components/pos/HeldSalesModal';
import POSReturnsModal from '../../components/pos/POSReturnsModal';
import POSSalesHistoryModal from '../../components/pos/POSSalesHistoryModal';
import AIPOSAssistantDrawer from '../../components/pos/AIPOSAssistantDrawer';
import ManualItemModal from '../../components/pos/ManualItemModal';
import { useOutletContext } from 'react-router-dom';
import type { POSLayoutContextType } from '../../components/MainLayout';

interface POSProduct {
  _id: string;
  id: string;
  productId: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  costPrice?: number;
  stock: number;
  image?: string;
  sizes: string[];
  colors: string[];
  hasVariants: boolean;
}

interface CartItem {
  cartId: string; // unique combo of productId + size + color
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

const CATEGORIES = [
  'All',
  'Unstitched',
  'Stitched',
  'Kurtis',
  'Men',
  'Pret',
  'Accessories',
  'Kids',
];

export default function POSScreen() {
  const { user } = useAuth();
  const outletContext = useOutletContext<POSLayoutContextType>();
  const isZenMode = outletContext?.isPOSZenMode ?? false;

  const toggleZenMode = () => {
    if (outletContext?.toggleZenMode) {
      outletContext.toggleZenMode();
    }
  };

  // Catalog State
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Live Clock
  const [currentTime, setCurrentTime] = useState<string>('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer Management
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Discount State
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Tax State (0%, 5%, 16%, 18%)
  const [showTaxSelector, setShowTaxSelector] = useState(false);
  const [taxRate, setTaxRate] = useState<number>(0);

  // Payment State (Easypaisa Exclusive)
  const paymentMethod = 'Easypaisa';
  const [easypaisaMobile, setEasypaisaMobile] = useState<string>('');
  const [easypaisaTrxId, setEasypaisaTrxId] = useState<string>('');

  // Processing & Receipts
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Variant Selection Popover Modal
  const [variantModalProduct, setVariantModalProduct] = useState<POSProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  // Advanced POS Modals
  const [showHeldSalesModal, setShowHeldSalesModal] = useState(false);
  const [heldSalesCount, setHeldSalesCount] = useState<number>(0);
  const [showReturnsModal, setShowReturnsModal] = useState(false);
  const [returnPreloadReceipt, setReturnPreloadReceipt] = useState<string>('');
  const [showSalesHistoryModal, setShowSalesHistoryModal] = useState(false);
  const [showAIDrawer, setShowAIDrawer] = useState(false);
  const [showManualItemModal, setShowManualItemModal] = useState(false);
  const [manualItemInitialName, setManualItemInitialName] = useState('');

  // Search input ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Live clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch products from POS endpoint
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setErrorBanner(null);
      const res = await authFetch('/api/pos/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
        }
      }
    } catch (err: any) {
      console.error('Failed to load POS products', err);
      setErrorBanner('Could not fetch catalog products from database.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch count of active held sales
  const fetchHeldSalesCount = async () => {
    try {
      const res = await authFetch('/api/pos/held');
      if (res.ok) {
        const data = await res.json();
        setHeldSalesCount(Array.isArray(data) ? data.length : 0);
      }
    } catch {
      // non-blocking
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchHeldSalesCount();
    searchInputRef.current?.focus();
  }, []);

  // Keyboard shortcut listener (F2: Search, F4: Clear, F6: Hold, F9: Checkout, F11: Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        activeElement !== searchInputRef.current &&
        (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT');

      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (e.key === 'F4' && !isInputFocused) {
        e.preventDefault();
        if (cart.length > 0 && confirm('Clear current POS cart?')) {
          setCart([]);
        }
        return;
      }

      if (e.key === 'F6' && !isInputFocused) {
        e.preventDefault();
        if (cart.length > 0) {
          handleHoldSale();
        }
        return;
      }

      if (e.key === 'F8' && !isInputFocused) {
        e.preventDefault();
        setManualItemInitialName('');
        setShowManualItemModal(true);
        return;
      }

      if ((e.key === 'F9' || (e.ctrlKey && e.key === 'Enter')) && !isInputFocused) {
        e.preventDefault();
        if (cart.length > 0 && !isProcessing) {
          handleCheckoutAndPrint();
        }
        return;
      }

      if (e.key === 'F11') {
        e.preventDefault();
        toggleZenMode();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isProcessing]);

  // Handle Search submit / SKU quick add on Enter
  const handleSearchSubmit = (code: string) => {
    const trimmed = code.trim().toLowerCase();
    const matched = products.find(
      (p) =>
        p.productId.toLowerCase() === trimmed ||
        p.sku?.toLowerCase() === trimmed ||
        p.name.toLowerCase() === trimmed
    );

    if (matched) {
      if (matched.stock <= 0) {
        alert(`Product "${matched.name}" is out of stock!`);
        return;
      }
      if (matched.hasVariants && matched.sizes.length > 1) {
        openVariantModal(matched);
      } else {
        addToCart(matched, matched.sizes[0] || 'Standard', matched.colors[0] || 'Default');
      }
      setSearchQuery('');
    } else {
      setSearchQuery(code);
      searchInputRef.current?.focus();
    }
  };

  // Add Product to Cart with stock boundary checks
  const addToCart = (product: POSProduct, size: string, color: string, qtyToAdd = 1) => {
    if (product.stock <= 0) {
      alert(`"${product.name}" is currently out of stock.`);
      return;
    }

    const cartId = `${product._id || product.id}_${size}_${color}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.cartId === cartId);
      if (existing) {
        const targetQty = existing.qty + qtyToAdd;
        if (targetQty > product.stock) {
          alert(`Cannot add more. Only ${product.stock} units currently available in stock.`);
          return prev;
        }
        return prev.map((item) =>
          item.cartId === cartId ? { ...item, qty: targetQty } : item
        );
      }

      if (qtyToAdd > product.stock) {
        alert(`Cannot add ${qtyToAdd} units. Only ${product.stock} units in stock.`);
        return prev;
      }

      return [
        ...prev,
        {
          cartId,
          productId: product._id || product.id,
          sku: product.productId || product.sku,
          name: product.name,
          category: product.category,
          price: product.price,
          qty: qtyToAdd,
          size,
          color,
          maxStock: product.stock,
          image: product.image,
        },
      ];
    });

    searchInputRef.current?.focus();
  };

  // Add Manual / Custom Item to Cart
  const handleAddManualItem = (manualItem: {
    cartId: string;
    productId: string;
    sku: string;
    name: string;
    category: string;
    price: number;
    qty: number;
    size: string;
    color: string;
    maxStock: number;
  }) => {
    setCart((prev) => [...prev, manualItem]);
    searchInputRef.current?.focus();
  };

  // Update Cart Quantity
  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.qty + delta;
            if (newQty <= 0) return null;
            if (newQty > item.maxStock) {
              alert(`Maximum available stock reached (${item.maxStock} units).`);
              return item;
            }
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  // Variant Modal
  const openVariantModal = (product: POSProduct) => {
    setVariantModalProduct(product);
    setSelectedSize(product.sizes[0] || 'Standard');
    setSelectedColor(product.colors[0] || 'Default');
  };

  const confirmVariantAdd = () => {
    if (!variantModalProduct) return;
    addToCart(variantModalProduct, selectedSize, selectedColor);
    setVariantModalProduct(null);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.productId.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Order Calculations: Subtotal + Tax - Discount = Grand Total
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!discountValue || discountValue <= 0) return 0;
    if (discountType === 'percentage') {
      return Math.round((subtotal * Math.min(100, discountValue)) / 100);
    }
    return Math.min(subtotal, Math.round(discountValue));
  }, [subtotal, discountType, discountValue]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxAmount = useMemo(() => {
    if (!taxRate || taxRate <= 0) return 0;
    return Math.round((taxableAmount * taxRate) / 100);
  }, [taxableAmount, taxRate]);

  const grandTotal = Math.max(0, taxableAmount + taxAmount);

  // Hold current active sale
  const handleHoldSale = async () => {
    if (cart.length === 0) {
      alert('Cannot hold an empty cart.');
      return;
    }

    try {
      const res = await authFetch('/api/pos/hold', {
        method: 'POST',
        body: JSON.stringify({
          items: cart,
          customerId: customer?._id,
          customerName: customer?.name || 'Walk-in Customer',
          customerPhone: customer?.phone || '',
          subtotal,
          discountType,
          discountValue,
          taxRate,
        }),
      });

      if (res.ok) {
        alert('Sale held successfully! Cart saved.');
        setCart([]);
        setDiscountValue(0);
        setTaxRate(0);
        setCustomer(null);
        fetchHeldSalesCount();
      }
    } catch {
      alert('Failed to hold sale.');
    }
  };

  // Resume sale from held modal
  const handleResumeSale = (heldSale: HeldSaleRecord) => {
    setCart(
      heldSale.items.map((it) => ({
        cartId: it.cartId || `${it.productId}_${it.size || 'Standard'}_${it.color || 'Default'}`,
        productId: it.productId,
        sku: it.sku,
        name: it.name,
        category: it.category,
        price: it.price,
        qty: it.qty,
        size: it.size,
        color: it.color,
        maxStock: it.maxStock || 99,
        image: it.image,
      }))
    );
    setDiscountType(heldSale.discountType || 'flat');
    setDiscountValue(heldSale.discountValue || 0);
    setTaxRate(heldSale.taxRate || 0);

    if (heldSale.customer) {
      setCustomer({
        _id: heldSale.customer,
        name: heldSale.customerName,
        phone: heldSale.customerPhone,
      });
    } else if (heldSale.customerName && heldSale.customerName !== 'Walk-in Customer') {
      setCustomer({
        _id: '',
        name: heldSale.customerName,
        phone: heldSale.customerPhone,
      });
    } else {
      setCustomer(null);
    }
    fetchHeldSalesCount();
  };

  // Checkout API Call with backend pricing and stock validation
  const handleCheckoutAndPrint = async () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please select garments to complete sale.');
      return;
    }

    setIsProcessing(true);
    setErrorBanner(null);

    try {
      const payload = {
        customerId: customer?._id,
        customerName: customer?.name || 'Walk-in Customer',
        customerPhone: customer?.phone || '',
        items: cart.map((item) => ({
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          size: item.size,
          color: item.color,
          price: item.price,
          qty: item.qty,
        })),
        discount: discountAmount,
        discountType,
        discountValue,
        taxRate,
        paymentMethod,
        cashTendered: grandTotal,
        changeDue: 0,
        easypaisaDetails: {
          mobileNumber: easypaisaMobile,
          trxId: easypaisaTrxId,
        },
      };

      const res = await authFetch('/api/pos/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Checkout failed');
      }

      // Format receipt data
      const receipt: ReceiptData = {
        receiptNumber: data.receiptNumber || `TH-${Date.now().toString().slice(-6)}`,
        date: new Date(),
        cashierName: user?.name || 'Counter Cashier',
        customerName: customer?.name || 'Walk-in Customer',
        customerPhone: customer?.phone || '',
        business: data.business,
        items: cart.map((i) => ({
          productName: i.name,
          productId: i.sku,
          size: i.size,
          color: i.color,
          qty: i.qty,
          price: i.price,
          subtotal: i.price * i.qty,
        })),
        subtotal,
        discount: discountAmount,
        discountType,
        discountValue,
        tax: taxAmount,
        taxRate,
        totalAmount: grandTotal,
        paymentMethod,
        cashTendered: grandTotal,
        changeDue: 0,
        easypaisaDetails: {
          mobileNumber: easypaisaMobile,
          trxId: easypaisaTrxId,
        },
      };

      setReceiptData(receipt);
      setShowReceiptModal(true);

      // Auto trigger print
      setTimeout(() => {
        window.print();
      }, 300);

      // Reset Register
      setCart([]);
      setDiscountValue(0);
      setTaxRate(0);
      setEasypaisaMobile('');
      setEasypaisaTrxId('');
      setCustomer(null);

      // Refresh stock counts
      fetchProducts();
      fetchHeldSalesCount();
    } catch (err: any) {
      console.error('POS Checkout error:', err);
      setErrorBanner(err.message || 'An error occurred during checkout.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reprint receipt from Sales History modal
  const handleReprintReceiptFromHistory = (sale: any) => {
    const formattedReceipt: ReceiptData = {
      receiptNumber: sale.receiptNumber,
      date: sale.date,
      cashierName: sale.cashierName || user?.name || 'Counter Cashier',
      customerName: sale.customerName || 'Walk-in Customer',
      customerPhone: sale.customerPhone,
      items: sale.items.map((i: any) => ({
        productName: i.productName,
        productId: i.productId,
        size: i.size,
        color: i.color,
        qty: i.qty,
        price: i.price,
        subtotal: i.price * i.qty,
      })),
      subtotal: sale.subtotal,
      discount: sale.discount,
      discountType: sale.discountType,
      discountValue: sale.discountValue,
      tax: sale.tax,
      taxRate: sale.taxRate,
      totalAmount: sale.totalAmount,
      refundAmount: sale.refundAmount,
      returnStatus: sale.returnStatus,
      paymentMethod: sale.paymentMethod,
      cashTendered: sale.cashTendered,
      changeDue: sale.changeDue,
      cardDetails: sale.cardDetails,
      bankTransferDetails: sale.bankTransferDetails,
    };
    setReceiptData(formattedReceipt);
    setShowReceiptModal(true);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white overflow-hidden select-none font-sans transition-colors">
      {/* ========================================================================= */}
      {/* TOP COMMAND BAR */}
      {/* ========================================================================= */}
      <header className="h-14 bg-white dark:bg-slate-950 text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-800 px-4 flex items-center justify-between gap-3 shrink-0 z-20 shadow-xs dark:shadow-md transition-colors">
        {/* Left: Brand & Register Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black border border-emerald-500/30 shadow-inner">
              <Store className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-gray-900 dark:text-white">
                  Threadly POS
                </span>
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                  Counter 1
                </span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium leading-none mt-0.5">
                Boutique Retail Terminal
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search Input */}
        <div className="flex-1 max-w-lg relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                e.preventDefault();
                handleSearchSubmit(searchQuery.trim());
              }
            }}
            placeholder="Search garment name, SKU (e.g. SKU-LAWN-001) or press F2..."
            className="w-full pl-10 pr-20 py-2 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all font-medium"
            autoFocus
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block text-[10px] bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-300 dark:border-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                F2
              </kbd>
            )}
          </div>
        </div>

        {/* Right: Quick Action Hub & AI Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* AI POS Assistant Button with Glow Indicator */}
          <button
            type="button"
            onClick={() => setShowAIDrawer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
            title="Open Gemini & ML AI POS Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
            <span>AI Assistant</span>
          </button>

          {/* Manual / Custom Item Quick Button in Top Bar */}
          <button
            type="button"
            onClick={() => {
              setManualItemInitialName('');
              setShowManualItemModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/25 cursor-pointer transition-all active:scale-95 shadow-2xs"
            title="Add Manual / Custom Garment to POS (F8)"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Manual Item</span>
            <kbd className="text-[9px] font-mono px-1 py-0.2 bg-emerald-600/20 rounded text-emerald-800 dark:text-emerald-300 font-bold">F8</kbd>
          </button>

          {/* Held Sales Button */}
          <button
            type="button"
            onClick={() => setShowHeldSalesModal(true)}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer',
              heldSalesCount > 0
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/40'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
            )}
            title="View Held / Suspended Sales"
          >
            <PauseCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Held</span>
            {heldSalesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                {heldSalesCount}
              </span>
            )}
          </button>

          {/* Returns & Restock Button */}
          <button
            type="button"
            onClick={() => setShowReturnsModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer transition-all"
            title="Process Customer Return & Restock Inventory"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden md:inline">Returns</span>
          </button>

          {/* Sales History Button */}
          <button
            type="button"
            onClick={() => setShowSalesHistoryModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer transition-all"
            title="View Sales History & Reprint Receipts"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden md:inline">History</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchProducts}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 cursor-pointer transition-all"
            title="Refresh Store Catalog"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', isLoading && 'animate-spin text-emerald-500')} />
          </button>

          {/* Live Clock */}
          <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-gray-200 dark:border-slate-800">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-mono text-xs font-bold text-gray-700 dark:text-slate-300">
              {currentTime || '12:00 PM'}
            </span>
          </div>

          {/* Fullscreen / Zen Toggle */}
          <button
            type="button"
            onClick={toggleZenMode}
            className={clsx(
              'p-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer',
              isZenMode
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
            )}
            title="Toggle Focus / Maximize Counter Mode (F11)"
          >
            {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Top Banner / Error notice */}
      {errorBanner && (
        <div className="bg-red-600 text-white px-4 py-2 text-xs flex items-center justify-between shrink-0 font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN TWO-COLUMN SPLIT POS COUNTER WORKSPACE */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors">
        {/* ======================================================================= */}
        {/* LEFT COLUMN: Garment Catalog & Filter (60% Width) */}
        {/* ======================================================================= */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 h-full overflow-hidden transition-colors">
          {/* Category Filter Bar */}
          <div className="px-4 py-2.5 bg-white/90 dark:bg-slate-950/80 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={clsx(
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                    selectedCategory === cat
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                      : 'bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* + Manual Item Button */}
            <button
              type="button"
              onClick={() => setShowManualItemModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
              title="Add Manual / Custom Garment to Bill (F8)"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>+ Manual Item (F8)</span>
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-900 p-0.5 rounded-xl border border-gray-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={clsx(
                  'p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
                )}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={clsx(
                  'p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
                )}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Product Catalog Display Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-gray-50/80 dark:bg-slate-900/90 transition-colors">
            {isLoading && products.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
                <p className="text-sm font-bold text-gray-800 dark:text-slate-200">Loading Garments Catalog...</p>
                <p className="text-xs text-gray-500 mt-1">Connecting to Threadly inventory</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-8 h-8 text-gray-400 stroke-[1.5]" />
                </div>
                <p className="text-base font-bold text-gray-800 dark:text-slate-200">No matching garments found</p>
                <p className="text-xs text-gray-500 mt-1 mb-4 text-center max-w-sm">
                  Try searching for another SKU, product name, or reset the category filters.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="text-xs py-2 px-4 rounded-xl cursor-pointer"
                  >
                    Reset Filters
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setManualItemInitialName(searchQuery);
                      setShowManualItemModal(true);
                    }}
                    className="text-xs py-2 px-4 rounded-xl cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 font-bold"
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    <span>{searchQuery.trim() ? `Add "${searchQuery}" as Manual` : 'Add as Manual Item'}</span>
                  </Button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= 5;

                  return (
                    <div
                      key={p._id || p.id}
                      onClick={() => {
                        if (isOutOfStock) return;
                        if (p.hasVariants && p.sizes.length > 1) {
                          openVariantModal(p);
                        } else {
                          addToCart(p, p.sizes[0] || 'Standard', p.colors[0] || 'Default');
                        }
                      }}
                      className={clsx(
                        'bg-white dark:bg-slate-950 rounded-2xl border overflow-hidden flex flex-col transition-all cursor-pointer select-none group shadow-xs dark:shadow-md relative',
                        isOutOfStock
                          ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-slate-800'
                          : 'border-gray-200/90 dark:border-slate-800/90 hover:border-emerald-500/80 hover:shadow-xl hover:-translate-y-0.5 active:scale-98'
                      )}
                    >
                      {/* Product Image & Badges */}
                      <div className="relative h-32 sm:h-36 w-full bg-gray-100 dark:bg-slate-900 overflow-hidden">
                        {p.image && !p.image.includes('1595777457583') ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e: any) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-900 text-gray-400 dark:text-slate-600 ${
                            p.image && !p.image.includes('1595777457583') ? 'hidden' : 'flex'
                          }`}
                        >
                          <Shirt className="w-10 h-10 stroke-[1.5]" />
                        </div>
                        {/* SKU Chip */}
                        <div className="absolute top-2 left-2 z-10">
                          <span className="bg-gray-950/85 text-white text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-gray-800/40 shadow-xs">
                            {p.sku || p.productId}
                          </span>
                        </div>
                        {/* Stock Pill */}
                        <div className="absolute top-2 right-2 z-10">
                          {isOutOfStock ? (
                            <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shadow-xs">
                              Out
                            </span>
                          ) : isLowStock ? (
                            <span className="bg-amber-500 text-slate-950 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                              Low ({p.stock})
                            </span>
                          ) : (
                            <span className="bg-emerald-500 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                              {p.stock} pcs
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Information */}
                      <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                        <div>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                            {p.category}
                          </p>
                          <h4
                            className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white line-clamp-2 mt-0.5 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors"
                            title={p.name}
                          >
                            {p.name}
                          </h4>
                          {p.sizes && p.sizes.length > 0 && p.sizes[0] !== 'Standard' && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500 dark:text-slate-400">
                              <span>Sizes:</span>
                              <span className="text-gray-700 dark:text-slate-300 font-medium">
                                {p.sizes.slice(0, 3).join(', ')}
                                {p.sizes.length > 3 && '...'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Price & Add Button */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800/80">
                          <div>
                            <span className="text-[10px] text-gray-400 block -mb-0.5 font-medium">Price</span>
                            <span className="text-xs sm:text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                              Rs. {p.price.toLocaleString()}
                            </span>
                          </div>
                          <span className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:text-slate-950 transition-all shadow-xs">
                            <Plus className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="space-y-2">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  return (
                    <div
                      key={p._id || p.id}
                      onClick={() => {
                        if (isOutOfStock) return;
                        if (p.hasVariants && p.sizes.length > 1) {
                          openVariantModal(p);
                        } else {
                          addToCart(p, p.sizes[0] || 'Standard', p.colors[0] || 'Default');
                        }
                      }}
                      className={clsx(
                        'flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 transition-all cursor-pointer shadow-xs',
                        isOutOfStock
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:border-emerald-500/80 hover:bg-gray-50 dark:hover:bg-slate-900 active:scale-99'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-center text-gray-400 shrink-0">
                          <Shirt className="w-5 h-5 stroke-[1.5]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-gray-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-800">
                              {p.sku || p.productId}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-gray-500">
                              {p.category}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate mt-0.5">
                            {p.name}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[11px] font-mono text-gray-500">
                          {p.stock} in stock
                        </span>
                        <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 w-24 text-right">
                          Rs. {p.price.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center font-bold transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: Master Register Panel (40% Width) */}
        {/* ======================================================================= */}
        <div className="w-full lg:w-[42%] xl:w-[40%] 2xl:w-[38%] min-w-[380px] xl:min-w-[430px] flex flex-col bg-white dark:bg-slate-950 h-full border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden transition-colors">
          {/* Customer Bar */}
          <div className="p-3 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800/90 flex items-center justify-between gap-3 shrink-0">
            <div
              onClick={() => setShowCustomerModal(true)}
              className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group"
              title="Click to search or select customer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors truncate">
                    {customer ? customer.name : 'Walk-in Customer'}
                  </span>
                  {customer?.phone && (
                    <span className="text-[10px] text-gray-500 font-mono">
                      ({customer.phone})
                    </span>
                  )}
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                    [Change]
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">
                  {customer
                    ? `${customer.totalOrders || 0} previous orders • Rs. ${(customer.totalSpent || 0).toLocaleString()} spent`
                    : 'Click to select or register customer profile'}
                </p>
              </div>
            </div>

            {/* Clear Cart Button */}
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-[11px] text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1 font-bold bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                title="Clear current cart (F4)"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear (F4)</span>
              </button>
            )}
          </div>

          {/* Cart Header Strip */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs text-gray-700 dark:text-slate-300 font-bold shrink-0">
            <div className="flex items-center gap-2">
              <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Register Items ({cart.reduce((s, i) => s + i.qty, 0)} Units)</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowManualItemModal(true)}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Add custom or unlisted garment"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>+ Manual</span>
              </button>
              <span className="text-gray-400 text-[10px] font-mono">PKR RATE</span>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-gray-100 dark:divide-slate-800/80 min-h-[140px] bg-gray-50/50 dark:bg-slate-950/60">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-center mb-2 text-gray-400 shadow-xs">
                  <Store className="w-6 h-6 stroke-[1.5]" />
                </div>
                <p className="text-xs font-bold text-gray-800 dark:text-slate-200">Register is Ready</p>
                <p className="text-[11px] text-gray-500 mt-0.5 text-center max-w-[240px]">
                  Click garments on the left catalog or search SKU above to add to bill.
                </p>
                <button
                  type="button"
                  onClick={() => setShowManualItemModal(true)}
                  className="mt-3 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>+ Add Manual Garment</span>
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.cartId} className="pt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-center text-gray-400 shrink-0">
                      <Shirt className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate leading-snug">
                        {item.name}
                      </h5>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.sku}</span>
                        {item.size && (
                          <span className="bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-1.5 py-0.2 rounded font-bold text-gray-700 dark:text-slate-300">
                            {item.size}
                          </span>
                        )}
                        {item.color && item.color !== 'Default' && (
                          <span className="bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-1.5 py-0.2 rounded text-gray-700 dark:text-slate-300">
                            {item.color}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono font-bold text-gray-700 dark:text-slate-300 mt-0.5">
                        Rs. {item.price.toLocaleString()} x {item.qty} ={' '}
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                          Rs. {(item.price * item.qty).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartId, -1)}
                      className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 flex items-center justify-center font-bold cursor-pointer transition-colors"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-black text-sm text-gray-900 dark:text-white font-mono">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartId, 1)}
                      className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 flex items-center justify-center font-bold cursor-pointer transition-colors"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartId)}
                      className="w-7 h-7 ml-1 text-gray-400 hover:text-red-500 flex items-center justify-center cursor-pointer transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DOCKED CHECKOUT HUB */}
          <div className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 sm:p-4 space-y-2.5 shrink-0 z-10 shadow-lg dark:shadow-2xl transition-colors">
            {/* Quick Discount & Tax Action Bar */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDiscountInput((prev) => !prev)}
                  className="flex items-center gap-1 text-[11px] font-bold text-gray-600 dark:text-slate-300 hover:text-emerald-600 cursor-pointer"
                >
                  <Tag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{showDiscountInput ? 'Hide Discount' : '+ Discount'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTaxSelector((prev) => !prev)}
                  className="flex items-center gap-1 text-[11px] font-bold text-gray-600 dark:text-slate-300 hover:text-emerald-600 cursor-pointer"
                >
                  <Percent className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{showTaxSelector ? 'Hide Tax' : `+ Tax (${taxRate}%)`}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {discountAmount > 0 && (
                  <span className="text-[11px] font-mono font-bold text-red-600 dark:text-red-400">
                    -Rs. {discountAmount.toLocaleString()}
                  </span>
                )}
                {taxAmount > 0 && (
                  <span className="text-[11px] font-mono font-bold text-gray-600 dark:text-slate-400">
                    +Rs. {taxAmount.toLocaleString()} Tax
                  </span>
                )}
              </div>
            </div>

            {/* Expandable Discount Form */}
            {showDiscountInput && (
              <div className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-slate-900 p-2 rounded-xl border border-gray-200 dark:border-slate-800 animate-in fade-in">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={clsx(
                      'px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors',
                      discountType === 'flat'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300'
                    )}
                  >
                    PKR Flat
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={clsx(
                      'px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors',
                      discountType === 'percentage'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300'
                    )}
                  >
                    % Off
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {[5, 10, 15].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setDiscountType('percentage');
                        setDiscountValue(preset);
                      }}
                      className="px-2 py-0.5 rounded bg-gray-200 dark:bg-slate-800 text-[10px] text-gray-700 dark:text-slate-300 hover:text-gray-900 cursor-pointer"
                    >
                      {preset}%
                    </button>
                  ))}
                  <input
                    type="number"
                    min="0"
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    placeholder="0"
                    className="w-16 px-2 py-1 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg text-right text-xs font-bold font-mono text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Expandable Tax Selector */}
            {showTaxSelector && (
              <div className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-slate-900 p-2 rounded-xl border border-gray-200 dark:border-slate-800 animate-in fade-in">
                <span className="text-[10px] font-bold uppercase text-gray-500">Sales Tax / GST:</span>
                <div className="flex items-center gap-1">
                  {[0, 5, 16, 18].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setTaxRate(rate)}
                      className={clsx(
                        'px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors',
                        taxRate === rate
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300'
                      )}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grand Total Display */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-900/90 rounded-2xl border border-gray-200 dark:border-slate-800 p-3 shadow-inner flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
                  Total Amount Payable
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  Subtotal: Rs. {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400 leading-none">
                  Rs. {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Method (Easypaisa Exclusive) */}
            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Easypaisa Mobile Wallet / QR
                </span>
                <span className="text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Official Gateway
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                    Sender Mobile # (Optional)
                  </label>
                  <input
                    type="text"
                    value={easypaisaMobile}
                    onChange={(e) => setEasypaisaMobile(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full text-xs font-mono font-bold bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                    Easypaisa TRX ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={easypaisaTrxId}
                    onChange={(e) => setEasypaisaTrxId(e.target.value)}
                    placeholder="e.g. EP-94821"
                    className="w-full text-xs font-mono font-bold bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight">
                Customer scans store Easypaisa QR or transfers directly to your Easypaisa merchant wallet.
              </p>
            </div>

            {/* Bottom Action Row: Hold Sale & Primary Complete Sale Button */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleHoldSale}
                disabled={cart.length === 0}
                className="py-3 px-3 rounded-xl text-xs font-bold border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center justify-center gap-1 cursor-pointer"
                title="Suspend/Hold Current Sale (F6)"
              >
                <PauseCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Hold (F6)</span>
              </Button>

              <Button
                variant="primary"
                onClick={handleCheckoutAndPrint}
                disabled={isProcessing || cart.length === 0}
                className={clsx(
                  'flex-1 py-3 text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-lg rounded-xl transition-all active:scale-98',
                  cart.length === 0
                    ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed border border-gray-300 dark:border-slate-700'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                )}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Processing Sale...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 text-slate-950" />
                    <span>Complete Sale (Rs. {grandTotal.toLocaleString()})</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VARIANT SELECTION MODAL */}
      {/* ========================================================================= */}
      {variantModalProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-gray-200 dark:border-slate-800 animate-in fade-in zoom-in-95 text-gray-900 dark:text-white">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                  Select Garment Variant
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                  {variantModalProduct.name}
                </h3>
                <p className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  Rs. {variantModalProduct.price.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setVariantModalProduct(null)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Size Selector */}
            {variantModalProduct.sizes.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">Size</label>
                <div className="flex flex-wrap gap-2">
                  {variantModalProduct.sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={clsx(
                        'px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer',
                        selectedSize === sz
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                      )}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {variantModalProduct.colors.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">Color</label>
                <div className="flex flex-wrap gap-2">
                  {variantModalProduct.colors.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      className={clsx(
                        'px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer',
                        selectedColor === col
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                      )}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setVariantModalProduct(null)}
                className="flex-1 text-xs py-2.5 font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmVariantAdd}
                className="flex-1 text-xs py-2.5 font-bold cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-slate-950"
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: Customer Select, Held Sales, Returns, Sales History, AI Assistant */}
      {/* ========================================================================= */}
      <CustomerSelectModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelectCustomer={(c) => setCustomer(c)}
        selectedCustomerId={customer?._id}
      />

      <HeldSalesModal
        isOpen={showHeldSalesModal}
        onClose={() => setShowHeldSalesModal(false)}
        onResumeSale={handleResumeSale}
      />

      <POSReturnsModal
        isOpen={showReturnsModal}
        onClose={() => {
          setShowReturnsModal(false);
          setReturnPreloadReceipt('');
        }}
        initialReceiptNumber={returnPreloadReceipt}
        onReturnSuccess={() => {
          fetchProducts();
        }}
      />

      <POSSalesHistoryModal
        isOpen={showSalesHistoryModal}
        onClose={() => setShowSalesHistoryModal(false)}
        onReprintReceipt={handleReprintReceiptFromHistory}
        onInitiateReturn={(sale) => {
          setReturnPreloadReceipt(sale.receiptNumber);
          setShowReturnsModal(true);
        }}
      />

      <AIPOSAssistantDrawer
        isOpen={showAIDrawer}
        onClose={() => setShowAIDrawer(false)}
        cart={cart}
        selectedCustomer={customer}
        onAddToCart={(p, sz, col, qty) => addToCart(p, sz || 'Standard', col || 'Default', qty || 1)}
        onSetDiscount={(type, val) => {
          setDiscountType(type);
          setDiscountValue(val);
        }}
        onSelectCustomer={(cust) => setCustomer(cust)}
        subtotal={subtotal}
        totalAmount={grandTotal}
      />

      <ManualItemModal
        isOpen={showManualItemModal}
        onClose={() => {
          setShowManualItemModal(false);
          setManualItemInitialName('');
        }}
        onAddManualItem={handleAddManualItem}
        onProductCreated={fetchProducts}
        initialName={manualItemInitialName}
      />

      {/* ========================================================================= */}
      {/* THERMAL RECEIPT PRINT MODAL */}
      {/* ========================================================================= */}
      {showReceiptModal && receiptData && (
        <ThermalReceipt
          receipt={receiptData}
          onClose={() => {
            setShowReceiptModal(false);
            setReceiptData(null);
            searchInputRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
