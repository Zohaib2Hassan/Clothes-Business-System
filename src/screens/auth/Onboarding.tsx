import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Onboarding() {
  return (
    <div className="flex flex-col h-[100dvh] w-full bg-white">
      {/* Image Section */}
      <div className="flex-1 p-4 pb-0">
        <div className="w-full h-full bg-gray-100 rounded-3xl overflow-hidden relative">
          <img 
            src="https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80" 
            alt="Fashion racks"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Text Section */}
      <div className="px-8 pt-8 pb-12 flex flex-col items-center text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900 leading-tight">
          Turn Your Fashion Business Into Growth
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Manage your products, keep inventory updated & growing effortlessly with AI assistant.
        </p>

        {/* Pagination Dots */}
        <div className="flex items-center space-x-2 pt-4">
          <div className="w-6 h-1.5 bg-gray-900 rounded-full" />
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-8 pb-10 flex justify-between items-center">
        <Link to="/register" className="text-gray-500 font-medium hover:text-gray-900 transition-colors">
          Skip
        </Link>
        <Link 
          to="/register" 
          className="bg-gray-900 text-white h-14 w-14 rounded-full flex items-center justify-center shadow-lg hover:bg-black transition-colors"
        >
          <ArrowRight size={24} />
        </Link>
      </div>
    </div>
  );
}
