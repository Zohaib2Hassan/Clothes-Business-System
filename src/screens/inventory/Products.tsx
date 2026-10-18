import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Shirt, LayoutGrid, List, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { authFetch } from '../../utils/api';
import { PRODUCT_CATEGORIES } from '../../constants/categories';
import { useLanguage } from '../../context/LanguageContext';
import clsx from 'clsx';

const filters = ['All', ...PRODUCT_CATEGORIES];

export default function Products() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/products');
      const data = await response.json();
      if (Array.isArray(data)) {
        setProductsList(data);
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDeleteProduct = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const response = await authFetch(`/api/products/${deleteId}`, { method: 'DELETE' });
      if (response.ok) {
        setDeleteId(null);
        await fetchProducts();
      }
    } catch (error) {
      console.error('Failed to delete product', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to extract formatted sizes
  const getProductSizes = (product: any): string => {
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      const filtered = product.sizes.filter((s: string) => s && s !== 'Standard');
      if (filtered.length > 0) {
        return filtered.slice(0, 3).join(', ') + (filtered.length > 3 ? '...' : '');
      }
    }
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const sizeVar = product.variants.find((v: any) => v.name?.toLowerCase() === 'size');
      if (sizeVar?.values) {
        const split = sizeVar.values
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
        if (split.length > 0) {
          return split.slice(0, 3).join(', ') + (split.length > 3 ? '...' : '');
        }
      }
    }
    return 'S, M, L...';
  };

  // Filter products by search query and category
  const filteredProducts = productsList.filter((product) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      product.name?.toLowerCase().includes(query) ||
      product.productId?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query);
    const matchesCategory = activeFilter === 'All' || product.category === activeFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('products.title', 'Products Catalog')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {t('products.subtitle', 'Manage your boutique clothing collection, prices & inventory stock')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
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
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              )}
              title="List View (Table)"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">List</span>
            </button>
          </div>

          {/* Add Product Button */}
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
        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer',
                activeFilter === filter
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              {filter}
            </button>
          ))}
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
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 mb-3">
            <Package className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No products found</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mb-4">
            {searchQuery || activeFilter !== 'All'
              ? 'No products match your current search and category filters. Try clearing the filters.'
              : 'Your boutique catalog is empty. Click "Add Product" to create your first clothing item.'}
          </p>
          {searchQuery || activeFilter !== 'All' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('All');
              }}
              className="text-xs"
            >
              Clear Filters
            </Button>
          ) : (
            <Link to="/products/add">
              <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                <Plus className="w-4 h-4" />
                Add First Product
              </Button>
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ========================================================================= */
        /* MODERN APPAREL CARDS GRID (Matches user reference & adapts to light/dark) */
        /* ========================================================================= */
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= 10;
            const sizesText = getProductSizes(product);

            return (
              <div
                key={product._id}
                className={clsx(
                  'bg-white dark:bg-slate-950 rounded-2xl border overflow-hidden flex flex-col transition-all select-none group shadow-xs hover:shadow-xl hover:-translate-y-0.5 relative',
                  isOutOfStock
                    ? 'border-gray-200 dark:border-slate-800 opacity-70'
                    : 'border-gray-200/90 dark:border-slate-800/90 hover:border-emerald-500/80 dark:hover:border-emerald-500/80'
                )}
              >
                {/* Product Image & Badges */}
                <div
                  onClick={() => navigate(`/products/${product._id}/edit`)}
                  className="relative h-36 sm:h-40 w-full bg-gray-100 dark:bg-slate-900 overflow-hidden cursor-pointer"
                >
                  {product.image && !product.image.includes('1595777457583') ? (
                    <img
                      src={product.image}
                      alt={product.name}
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
                      product.image && !product.image.includes('1595777457583') ? 'hidden' : 'flex'
                    )}
                  >
                    <Shirt className="w-10 h-10 stroke-[1.5]" />
                  </div>

                  {/* SKU Chip (Top-Left) */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-gray-950/85 dark:bg-slate-950/90 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-gray-800/60 dark:border-slate-800 shadow-xs">
                      {product.productId || 'PRD-0000'}
                    </span>
                  </div>

                  {/* Stock Pill (Top-Right) */}
                  <div className="absolute top-2 right-2 z-10">
                    {isOutOfStock ? (
                      <span className="bg-red-500/95 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shadow-xs">
                        Out
                      </span>
                    ) : isLowStock ? (
                      <span className="bg-amber-500/95 text-slate-950 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        {product.stock} pcs
                      </span>
                    ) : (
                      <span className="bg-emerald-500/95 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                        {product.stock} pcs
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Details Body */}
                <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                  <div>
                    {/* Category */}
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">
                      {product.category || 'Uncategorized'}
                    </p>

                    {/* Product Name */}
                    <h4
                      onClick={() => navigate(`/products/${product._id}/edit`)}
                      className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white line-clamp-1 mt-0.5 leading-snug cursor-pointer group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                      title={product.name}
                    >
                      {product.name}
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
                        Rs. {product.price?.toLocaleString()}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/products/${product._id}/edit`}
                        className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-slate-950 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(product._id);
                        }}
                        className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* COMPACT LIST VIEW */
        /* ========================================================================= */
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="divide-y divide-gray-100 dark:divide-slate-800/80">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-gray-50/80 dark:hover:bg-slate-900/60 transition-colors gap-3"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {product.image && !product.image.includes('1595777457583') ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-slate-900 text-gray-400 dark:text-slate-600 border border-gray-200 dark:border-slate-800 flex flex-col items-center justify-center shrink-0">
                      <Shirt className="w-6 h-6 stroke-[1.5]" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 rounded text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                        {product.productId}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {product.category || 'Uncategorized'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate mt-0.5">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Rs. {product.price?.toLocaleString()}
                      </span>
                      <span className="text-gray-300 dark:text-slate-700">•</span>
                      {product.stock > 10 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {product.stock} pcs in stock
                        </span>
                      ) : product.stock > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          Low Stock: {product.stock} pcs
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-bold">Out of Stock</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/products/${product._id}/edit`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-gray-200 dark:border-slate-700 dark:hover:bg-slate-800 text-xs py-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                  </Link>
                  <button
                    onClick={() => setDeleteId(product._id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Product?</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
              This action cannot be undone. The product will be permanently removed from inventory.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 !bg-red-600 hover:!bg-red-700 text-white"
                onClick={handleDeleteProduct}
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
