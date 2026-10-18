import { useNavigate } from 'react-router-dom';
import { Store, DollarSign, Tag, Camera } from 'lucide-react';
import { useState } from 'react';
import Logo from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

export default function SetupBusiness() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [storeName, setStoreName] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [category, setCategory] = useState("Men's Wear");
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!storeName) {
      setError('Please enter your store name');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          businessName: storeName,
          businessType: category,
          city: 'Pakistan',
          currency,
        }),
      });

      if (res.ok) {
        navigate('/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to setup business');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-brand-100 blur-3xl opacity-50"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-brand-100 blur-3xl opacity-50"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-brand-50 p-4 rounded-2xl mb-4 text-brand-800">
              <Logo className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Set Up Your Store</h1>
            <p className="text-gray-500 text-sm mt-1">Tell us a bit about your clothing business.</p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="relative h-24 w-24 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
              <Camera className="h-6 w-6 text-brand-800 mb-1" />
              <span className="text-[10px] text-gray-500 font-medium">Add Logo</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Store className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  placeholder="e.g. Ali's Boutique"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                >
                  <option value="PKR">Pakistani Rupee (PKR)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Category</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Tag className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                >
                  <option value="Men's Wear">Men's Wear</option>
                  <option value="Women's Wear">Women's Wear</option>
                  <option value="Kids Clothing">Kids Clothing</option>
                  <option value="Unisex / All">Unisex / All</option>
                </select>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full py-3.5 text-base mt-8" disabled={isLoading}>
              {isLoading ? 'Setting Up...' : 'Complete Setup'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
