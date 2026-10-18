import { ChevronLeft, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRODUCT_CATEGORIES } from '../../constants/categories';

export default function FilterSort() {
  return (
    <div className="flex flex-col bg-white min-h-full">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 bg-white sticky top-0 z-10 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Link to="/products" className="text-gray-900">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Filter & Sort</h1>
        </div>
        <Link to="/products" className="text-gray-400">
          <X size={24} />
        </Link>
      </div>

      <div className="p-6 space-y-8 flex-1">
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4">Sort By</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="radio" name="sort" className="w-5 h-5 text-gray-900 focus:ring-gray-900" defaultChecked />
              <span className="text-gray-700">Newest First</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="radio" name="sort" className="w-5 h-5 text-gray-900 focus:ring-gray-900" />
              <span className="text-gray-700">Price: Low to High</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="radio" name="sort" className="w-5 h-5 text-gray-900 focus:ring-gray-900" />
              <span className="text-gray-700">Price: High to Low</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="radio" name="sort" className="w-5 h-5 text-gray-900 focus:ring-gray-900" />
              <span className="text-gray-700">Top Selling</span>
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4">Category</h3>
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium">All</button>
            {PRODUCT_CATEGORIES.map((cat) => (
              <button key={cat} className="px-4 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors">
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4">Price Range</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Min</p>
              <input type="number" placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900" />
            </div>
            <div className="text-gray-400 mt-5">-</div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Max</p>
              <input type="number" placeholder="10000" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-100">
        <Link to="/products" className="w-full flex items-center justify-center py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-black transition-colors">
          Apply Filters
        </Link>
      </div>
    </div>
  );
}
