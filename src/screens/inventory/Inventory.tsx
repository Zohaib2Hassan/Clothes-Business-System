import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Edit2, 
  Edit3, 
  Package, 
  Shirt, 
  LayoutGrid, 
  List, 
  AlertCircle, 
  AlertTriangle, 
  Check, 
  X,
  Minus
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { authFetch } from '../../utils/api';
import { PRODUCT_CATEGORIES } from '../../constants/categories';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import clsx from 'clsx';

const stockStatusFilters = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];
const filters = [...stockStatusFilters, ...PRODUCT_CATEGORIES];

export default function Inventory() {
  const { compactMode } = useTheme();
  const { t } = useLanguage();

  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(compactMode ? 'list' : 'grid');

  // Stock edit modal state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newStock, setNewStock] = useState<number | string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventoryItems(data.items || []);
      } else {
        // Fallback to /api/products if inventory route is not yet cached
        const prodRes = await authFetch('/api/products');
        if (prodRes.ok) {
          const prods = await prodRes.json();
          const items = prods.map((product: any) => {
            let status = 'In Stock';
            if (product.stock === 0) status = 'Out of Stock';
            else if (product.stock <= 10) status = 'Low Stock';

            return {
              _id: product._id,
              id: product._id,
              productId: product.productId,
              name: product.name,
              category: product.category,
              price: product.price,
              costPrice: product.costPrice,
              stock: product.stock || 0,
              status,
              image: (product.image && !product.image.includes('1595777457583')) ? product.image : '',
              variants: product.variants,
              sizes: product.sizes
            };
          });
          setInventoryItems(items);
        }
      }
    } catch (error) {
      console.error('Failed to fetch inventory', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openStockModal = (item: any) => {
    setSelectedProduct(item);
    setNewStock(item.stock);
    setErrorMessage('');
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const parsedStock = Number(newStock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      setErrorMessage('Please enter a valid stock quantity (0 or higher)');
      return;
    }

    setIsUpdating(true);
    setErrorMessage('');

    try {
      const response = await authFetch('/api/inventory/update-stock', {
        method: 'PUT',
        body: JSON.stringify({
          productId: selectedProduct._id || selectedProduct.id,
          stock: parsedStock,
        }),
      });

      if (response.ok) {
        let status = 'In Stock';
        if (parsedStock === 0) status = 'Out of Stock';
        else if (parsedStock <= 10) status = 'Low Stock';

        setInventoryItems((prev) =>
          prev.map((item) =>
            (item._id || item.id) === (selectedProduct._id || selectedProduct.id)
              ? { ...item, stock: parsedStock, status }
              : item
          )
        );
        setSelectedProduct(null);
      } else {
        const err = await response.json();
        setErrorMessage(err.message || 'Failed to update stock');
      }
    } catch (error) {
      console.error('Error updating stock', error);
      setErrorMessage('Network error occurred while updating stock.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to extract formatted sizes
  const getProductSizes = (item: any): string => {
    if (Array.isArray(item.sizes) && item.sizes.length > 0) {
      const filtered = item.sizes.filter((s: string) => s && s !== 'Standard');
      if (filtered.length > 0) return filtered.join(', ');
    }
    if (Array.isArray(item.variants) && item.variants.length > 0) {
      const sizeVariant = item.variants.find((v: any) => v.name?.toLowerCase() === 'size');
      if (sizeVariant?.values) return sizeVariant.values;
    }
    return 'Standard';
  };

  // Filter items by category/status and search query
  const filteredItems = inventoryItems.filter((item) => {
    // Search query filter (matches name, SKU or category)
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchesName = item.name?.toLowerCase().includes(query);
      const matchesSku = item.productId?.toLowerCase().includes(query);
      const matchesCat = item.category?.toLowerCase().includes(query);
      if (!matchesName && !matchesSku && !matchesCat) return false;
    }

    // Category / status filter
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Low Stock') return item.status === 'Low Stock';
    if (activeFilter === 'Out of Stock') return item.status === 'Out of Stock';
    if (activeFilter === 'In Stock') return item.status === 'In Stock';
    
    // Category match
    return item.category?.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header matching Products Catalog design */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('nav.inventory', 'Inventory')} Catalog
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            Manage your boutique clothing collection, stock levels & live counts
          </p>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Grid vs List Toggle Switch */}
          <div className="bg-gray-100 dark:bg-slate-900 p-1 rounded-xl flex items-center border border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              )}
              title="Grid View (Apparel Cards)"
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
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              )}
              title="List View (Table)"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">List</span>
            </button>
          </div>

          {/* Add Product Shortcut */}
          <Link to="/products/add">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold shadow-xs">
              <Plus className="w-4 h-4" />
              {t('products.addProduct', 'Add Product')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category & Status Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
          {filters.map((filter) => {
            const isStockStatus = stockStatusFilters.includes(filter);
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer',
                  activeFilter === filter
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                    : isStockStatus
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/80'
                    : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, SKU or category..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Loading inventory items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 mb-3">
            <Package className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No inventory items found</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mb-4">
            {searchQuery || activeFilter !== 'All'
              ? 'No products match your current search and filters. Try clearing the filters.'
              : 'Your inventory is currently empty. Add products to populate your inventory.'}
          </p>
          {searchQuery || activeFilter !== 'All' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('All');
              }}
              className="text-xs cursor-pointer"
            >
              Clear Filters
            </Button>
          ) : (
            <Link to="/products/add">
              <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer">
                <Plus className="w-4 h-4" />
                Add First Product
              </Button>
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ========================================================================= */
        /* MODERN APPAREL CARDS GRID (Matches Products Screen Layout Exactly)       */
        /* ========================================================================= */
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4">
          {filteredItems.map((item) => {
            const isOutOfStock = item.stock <= 0;
            const isLowStock = item.stock > 0 && item.stock <= 10;
            const sizesText = getProductSizes(item);

            return (
              <div
                key={item._id || item.id}
                className={clsx(
                  'bg-white dark:bg-slate-950 rounded-2xl border overflow-hidden flex flex-col transition-all select-none group shadow-xs hover:shadow-xl hover:-translate-y-0.5 relative',
                  isOutOfStock
                    ? 'border-gray-200 dark:border-slate-800 opacity-75'
                    : 'border-gray-200/90 dark:border-slate-800/90 hover:border-emerald-500/80 dark:hover:border-emerald-500/80'
                )}
              >
                {/* Product Image & Badges */}
                <div
                  onClick={() => openStockModal(item)}
                  className="relative h-36 sm:h-40 w-full bg-gray-100 dark:bg-slate-900 overflow-hidden cursor-pointer"
                  title="Click to adjust stock"
                >
                  {item.image && !item.image.includes('1595777457583') ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e: any) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={clsx(
                      'w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-900 text-gray-400 dark:text-slate-600',
                      item.image && !item.image.includes('1595777457583') ? 'hidden' : 'flex'
                    )}
                  >
                    <Shirt className="w-10 h-10 stroke-[1.5]" />
                  </div>

                  {/* SKU Chip (Top-Left) */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-gray-950/85 dark:bg-slate-950/90 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-gray-800/60 dark:border-slate-800 shadow-xs">
                      {item.productId || 'PRD-0000'}
                    </span>
                  </div>

                  {/* Stock Pill (Top-Right) */}
                  <div className="absolute top-2 right-2 z-10">
                    {isOutOfStock ? (
                      <span className="bg-red-500/95 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shadow-xs flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" />
                        Out
                      </span>
                    ) : isLowStock ? (
                      <span className="bg-amber-500/95 text-slate-950 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {item.stock} pcs
                      </span>
                    ) : (
                      <span className="bg-emerald-500/95 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        {item.stock} pcs
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Details Body */}
                <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                  <div>
                    {/* Category */}
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">
                      {item.category || 'Apparel'}
                    </p>

                    {/* Product Name */}
                    <h4
                      onClick={() => openStockModal(item)}
                      className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white line-clamp-1 mt-0.5 leading-snug cursor-pointer group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                      title={item.name}
                    >
                      {item.name}
                    </h4>

                    {/* Sizes Row */}
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500 dark:text-slate-400">
                      <span>Sizes:</span>
                      <span className="text-gray-700 dark:text-slate-300 font-medium truncate">
                        {sizesText}
                      </span>
                    </div>
                  </div>

                  {/* Price & Action Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-gray-400 dark:text-slate-400 block -mb-0.5 font-medium">
                        {t('products.price', 'Price')}
                      </span>
                      <span className="text-xs sm:text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                        Rs. {(item.price || 0).toLocaleString()}
                      </span>
                    </div>

                    {/* Action Buttons: Quick Adjust Stock + Edit Product */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openStockModal(item);
                        }}
                        className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-slate-950 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                        title="Adjust Stock Quantity"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        to={`/products/${item._id || item.id}/edit`}
                        className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                        title="Edit Product Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* COMPACT LIST VIEW TABLE                                                  */
        /* ========================================================================= */
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="divide-y divide-gray-100 dark:divide-slate-800/80">
            {filteredItems.map((item) => {
              const isOutOfStock = item.stock <= 0;
              const isLowStock = item.stock > 0 && item.stock <= 10;
              const sizesText = getProductSizes(item);

              return (
                <div
                  key={item._id || item.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-gray-50/80 dark:hover:bg-slate-900/60 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {item.image && !item.image.includes('1595777457583') ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-slate-900 text-gray-400 dark:text-slate-600 border border-gray-200 dark:border-slate-800 flex flex-col items-center justify-center shrink-0">
                        <Shirt className="w-6 h-6 stroke-[1.5]" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-1.5 py-0.5 rounded-md">
                          {item.productId || 'PRD-0000'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          {item.category || 'Apparel'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate mt-0.5">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Sizes: <span className="font-medium text-gray-700 dark:text-slate-300">{sizesText}</span>
                      </p>
                    </div>
                  </div>

                  {/* Stock, Price & Actions */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-gray-900 dark:text-white block">
                        Rs. {(item.price || 0).toLocaleString()}
                      </span>
                      <span
                        className={clsx(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5',
                          isOutOfStock
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                            : isLowStock
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        )}
                      >
                        {item.stock} in stock
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openStockModal(item)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Adjust Stock"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Adjust</span>
                      </button>

                      <Link
                        to={`/products/${item._id || item.id}/edit`}
                        className="p-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADJUST STOCK QUANTITY MODAL                               */}
      {/* ========================================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/60">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {t('inventory.adjustStock', 'Adjust Stock Quantity')}
              </h2>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStock} className="p-5 space-y-4">
              {/* Product preview */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                {selectedProduct.image && !selectedProduct.image.includes('1595777457583') ? (
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-400 flex items-center justify-center shrink-0 border border-gray-200 dark:border-slate-700">
                    <Shirt className="w-6 h-6 stroke-[1.5]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                    {selectedProduct.productId || 'PRD-0000'}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {selectedProduct.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {t('inventory.currentStock', 'Current Stock')}: <span className="font-bold text-gray-800 dark:text-slate-200">{selectedProduct.stock} pcs</span>
                  </p>
                </div>
              </div>

              {/* Quantity Input with Stepper */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  {t('inventory.newStock', 'New Stock Quantity')}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStock((prev) => Math.max(0, Number(prev || 0) - 1))}
                    className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 flex items-center justify-center transition-colors font-bold cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="flex-1 px-3 py-2 text-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-base font-bold font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="Enter stock quantity"
                  />
                  <button
                    type="button"
                    onClick={() => setNewStock((prev) => Number(prev || 0) + 1)}
                    className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 flex items-center justify-center transition-colors font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 cursor-pointer"
                  onClick={() => setSelectedProduct(null)}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold cursor-pointer"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : t('inventory.updateStock', 'Update Stock')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
