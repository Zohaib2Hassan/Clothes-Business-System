import { ChevronLeft, UploadCloud, Plus, X, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { authFetch } from '../../utils/api';
import { PRODUCT_CATEGORIES } from '../../constants/categories';

export default function AddProduct() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [variants, setVariants] = useState([{ name: 'Size', values: '' }]);
  
  const [productId, setProductId] = useState(() => `PRD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateRandomId = () => {
    setProductId(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const addVariant = () => {
    setVariants([...variants, { name: 'Size', values: '' }]);
  };

  const removeVariant = (indexToRemove: number) => {
    setVariants(variants.filter((_, index) => index !== indexToRemove));
  };

  const updateVariant = (index: number, field: 'name' | 'values', value: string) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await authFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          productId: productId.trim(),
          name: name.trim(),
          category,
          price: Number(price),
          costPrice: Number(costPrice) || 0,
          stock: Number(stock),
          image: imagePreview,
          variants
        })
      });

      if (response.ok) {
        navigate('/products');
      } else {
        const errorData = await response.json();
        alert('Failed to save product: ' + errorData.message);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/products" className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add Product</h1>
          <p className="text-gray-500 text-sm mt-1">Add a new product to your inventory.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ID & Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Product ID / Code <span className="text-red-500">*</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={generateRandomId}
                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium hover:underline"
                    title="Auto-generate a new ID"
                  >
                    <Sparkles className="w-3 h-3" />
                    Auto
                  </button>
                </div>
                <input 
                  type="text" 
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                  placeholder="e.g. PRD-1001 or KRT-01"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Classic White T-Shirt"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            {/* Category & Pricing Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">Select Category</option>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (Rs) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price (Rs) - optional
                </label>
                <input 
                  type="number" 
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Stock <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  placeholder="0"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <div 
              onClick={handleUploadClick}
              className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden relative"
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <ImageIcon className="w-8 h-8 text-white mb-2" />
                    <p className="text-white text-sm font-medium">Click to change image</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                    <UploadCloud className="w-6 h-6 text-brand-800" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {variants.map((variant, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Option Name</label>
                  <select 
                    value={variant.name}
                    onChange={(e) => updateVariant(index, 'name', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="Size">Size</option>
                    <option value="Color">Color</option>
                    <option value="Material">Material</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Option Values</label>
                  <input 
                    type="text" 
                    list={`suggestions-${index}`}
                    value={variant.values}
                    onChange={(e) => updateVariant(index, 'values', e.target.value)}
                    placeholder={
                      variant.name === 'Size' ? "e.g. S, M, L, XL" :
                      variant.name === 'Color' ? "e.g. Red, Blue, Black" :
                      "e.g. Cotton, Denim, Leather"
                    }
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <datalist id={`suggestions-${index}`}>
                    {variant.name === 'Size' && (
                      <>
                        <option value="S, M, L, XL" />
                        <option value="28, 30, 32, 34" />
                        <option value="Free Size" />
                      </>
                    )}
                    {variant.name === 'Color' && (
                      <>
                        <option value="Black, White, Grey" />
                        <option value="Red, Blue, Green" />
                        <option value="Navy, Olive, Maroon" />
                      </>
                    )}
                    {variant.name === 'Material' && (
                      <>
                        <option value="100% Cotton" />
                        <option value="Denim" />
                        <option value="Polyester Blend" />
                        <option value="Leather" />
                      </>
                    )}
                  </datalist>
                </div>
                {variants.length > 1 && (
                  <div className="pt-6">
                    <button 
                      type="button" 
                      onClick={() => removeVariant(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            <Button type="button" onClick={addVariant} variant="outline" className="gap-2 text-sm mt-2">
              <Plus className="w-4 h-4" />
              Add another option
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Link to="/products">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
