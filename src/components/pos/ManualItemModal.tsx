import { useState, useEffect } from 'react';
import { Plus, X, PackagePlus, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { authFetch } from '../../utils/api';

export interface ManualItemData {
  name: string;
  category: string;
  price: number;
  qty: number;
  size?: string;
  color?: string;
  sku?: string;
  saveToInventory?: boolean;
}

interface ManualItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddManualItem: (item: {
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
  }) => void;
  onProductCreated?: () => void;
  initialName?: string;
}

const COMMON_CATEGORIES = [
  'Kurtis',
  'Unstitched',
  'Stitched',
  'Men',
  'Pret',
  'Accessories',
  'Kids',
  'Alteration & Tailoring',
  'Custom Garment',
];

const STANDARD_SIZES = ['Standard', 'Free Size', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'];

const QUICK_PRESETS = [
  { label: 'Suit Alteration / Fitting', category: 'Alteration & Tailoring', price: 350 },
  { label: 'Pico / Interlock', category: 'Alteration & Tailoring', price: 150 },
  { label: 'Custom Stitching (2-Piece)', category: 'Alteration & Tailoring', price: 1800 },
  { label: 'Custom Stitching (3-Piece)', category: 'Alteration & Tailoring', price: 2500 },
  { label: 'Dupatta Dyeing / Matching', category: 'Alteration & Tailoring', price: 400 },
  { label: 'Unlisted Lawn Kurti', category: 'Kurtis', price: 1850 },
  { label: 'Unlisted Lawn 3-Piece', category: 'Unstitched', price: 3200 },
  { label: 'Ready-to-Wear Stitched Suit', category: 'Stitched', price: 4500 },
  { label: 'Custom Men Kurta', category: 'Men', price: 2200 },
  { label: 'Shawl / Dupatta Extra', category: 'Accessories', price: 950 },
];

export default function ManualItemModal({
  isOpen,
  onClose,
  onAddManualItem,
  onProductCreated,
  initialName = '',
}: ManualItemModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Custom Garment');
  const [price, setPrice] = useState<number | ''>('');
  const [qty, setQty] = useState<number>(1);
  const [size, setSize] = useState('Standard');
  const [customSize, setCustomSize] = useState('');
  const [color, setColor] = useState('Default');
  const [sku, setSku] = useState(`MANUAL-${Math.floor(1000 + Math.random() * 9000)}`);
  const [saveToInventory, setSaveToInventory] = useState(false);
  const [stock, setStock] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Prepopulate if initialName is provided whenever modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialName && initialName.trim()) {
        setName(initialName.trim());
      }
      setErrorMsg('');
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Item name is required.');
      return;
    }
    const numPrice = Number(price);
    if (!price || isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('Please enter a valid price in PKR.');
      return;
    }

    const finalSize = size === 'Custom' && customSize.trim() ? customSize.trim() : size;
    const finalColor = color.trim() || 'Default';
    const finalSku = sku.trim() || `MANUAL-${Date.now().toString().slice(-4)}`;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let createdProductId = `custom-${Date.now()}`;

      // If cashier requested saving this item into permanent MongoDB catalog
      if (saveToInventory) {
        const res = await authFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify({
            productId: finalSku,
            name: name.trim(),
            category,
            price: numPrice,
            costPrice: Math.round(numPrice * 0.7),
            stock: Math.max(qty, Number(stock) || 20),
            variants: [
              { name: 'Size', values: finalSize },
              { name: 'Color', values: finalColor },
            ],
          }),
        });

        if (res.ok) {
          const created = await res.json();
          createdProductId = created._id || createdProductId;
          if (onProductCreated) {
            onProductCreated();
          }
        }
      }

      const cartId = `${createdProductId}_${finalSize}_${finalColor}_manual`;

      onAddManualItem({
        cartId,
        productId: createdProductId,
        sku: finalSku,
        name: name.trim(),
        category,
        price: numPrice,
        qty: Math.max(1, qty),
        size: finalSize,
        color: finalColor,
        maxStock: saveToInventory ? Math.max(qty, Number(stock) || 20) : 999,
      });

      // Reset form
      setName('');
      setPrice('');
      setQty(1);
      setSize('Standard');
      setCustomSize('');
      setColor('Default');
      setSku(`MANUAL-${Math.floor(1000 + Math.random() * 9000)}`);
      setSaveToInventory(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error adding manual item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Add Manual / Custom Garment</h3>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">Bill unlisted item, tailoring or alteration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Clothing Presets */}
        <div className="px-3.5 py-2 bg-gray-50 dark:bg-slate-900/70 border-b border-gray-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              Quick Boutique & Alteration Presets:
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {QUICK_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setName(p.label);
                  setCategory(p.category);
                  setPrice(p.price);
                }}
                className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                {p.label} <span className="font-mono text-emerald-600 dark:text-emerald-400">Rs. {p.price}</span>
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xs px-4 py-2 border-b border-red-200 dark:border-red-900 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* Garment Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-700 dark:text-slate-300 mb-1">
              Garment / Item Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Custom Embroidered Kurti or Alteration"
              className="w-full text-xs font-bold px-3 py-2 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-2 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                {COMMON_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-700 dark:text-slate-300 mb-1">
                Price (PKR) *
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-400">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="2500"
                  className="w-full pl-8 pr-2.5 py-2 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Quantity & SKU */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-700 dark:text-slate-300 mb-1">
                Quantity
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold flex items-center justify-center text-sm cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full text-center py-1.5 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs font-bold font-mono text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold flex items-center justify-center text-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-700 dark:text-slate-300 mb-1">
                SKU / Item Code
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="MANUAL-001"
                className="w-full px-2.5 py-2 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Size & Color */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-700 dark:text-slate-300 mb-1">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-2 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white"
              >
                {STANDARD_SIZES.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
              {size === 'Custom' && (
                <input
                  type="text"
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  placeholder="Enter size (e.g. 38, Chest 40)"
                  className="mt-1.5 w-full text-xs px-2.5 py-1.5 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-700 dark:text-slate-300 mb-1">
                Color
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Black, Mustard, Maroon"
                className="w-full text-xs px-2.5 py-2 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Save to Permanent Inventory Option */}
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveToInventory}
                onChange={(e) => setSaveToInventory(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                Save to Store Catalog (Inventory)
              </span>
            </label>

            {saveToInventory && (
              <div className="pt-1.5 pl-6 flex items-center gap-2 animate-in fade-in">
                <span className="text-[11px] text-gray-500 dark:text-slate-400">Initial Stock Quantity:</span>
                <input
                  type="number"
                  min="1"
                  value={stock}
                  onChange={(e) => setStock(Math.max(1, Number(e.target.value) || 1))}
                  className="w-16 text-center text-xs font-bold font-mono px-2 py-1 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 text-xs py-2.5 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex-1 text-xs py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add to POS Cart'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
