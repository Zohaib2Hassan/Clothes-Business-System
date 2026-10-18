import { ChevronLeft, UploadCloud, Plus, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { authFetch } from '../../utils/api';
import { PRODUCT_CATEGORIES } from '../../constants/categories';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [variants, setVariants] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await authFetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProductId(data.productId || '');
          setName(data.name || '');
          setCategory(data.category || '');
          setPrice(data.price || 0);
          setCostPrice(data.costPrice || 0);
          setStock(data.stock || 0);
          setImages(data.image && !data.image.includes('1595777457583') ? [data.image] : []);
          setVariants(data.variants || []);
        } else {
          // If product not found (e.g. wiped from memory db), redirect back
          navigate('/products');
        }
      } catch (err) {
        console.error(err);
        navigate('/products');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages([...images, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
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
    setIsSaving(true);
    try {
      const res = await authFetch(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          productId: productId.trim(),
          name,
          category,
          price,
          costPrice,
          stock,
          image: images[0] || '',
          variants
        })
      });
      if (res.ok) {
        navigate('/products');
      } else {
        const errData = await res.json();
        alert('Failed to update product: ' + errData.message);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while updating the product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading product details...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/products" className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Product</h1>
          <p className="text-gray-500 text-sm mt-1">Update product details and inventory.</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Product ID / Code</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            {/* Category & Pricing Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">Select Category</option>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  {category && !PRODUCT_CATEGORIES.includes(category as any) && (
                    <option value={category}>{category}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (Rs)</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (Rs) - optional</label>
                <input 
                  type="number" 
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input 
                  type="number" 
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value) || 0)}
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
            <div className="flex gap-4 flex-wrap">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-32 h-32 rounded-xl border border-gray-200 overflow-hidden">
                  <img src={img} alt="Product" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeImage(idx);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm text-red-500 hover:bg-red-50 cursor-pointer z-10"
                  >
                    <X className="w-3 h-3 pointer-events-none" />
                  </button>
                </div>
              ))}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center mb-2">
                  <UploadCloud className="w-4 h-4 text-brand-800" />
                </div>
                <p className="text-xs font-medium text-gray-900">Add Image</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Variants</CardTitle>
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
                    list={`suggestions-edit-${index}`}
                    value={variant.values}
                    onChange={(e) => updateVariant(index, 'values', e.target.value)}
                    placeholder={
                      variant.name === 'Size' ? "e.g. S, M, L, XL" :
                      variant.name === 'Color' ? "e.g. Red, Blue, Black" :
                      "e.g. Cotton, Denim, Leather"
                    }
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <datalist id={`suggestions-edit-${index}`}>
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
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Updating...' : 'Update Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
