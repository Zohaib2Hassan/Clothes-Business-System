import { Link } from 'react-router-dom';
import Logo from '../../components/ui/Logo';

export default function Splash() {
  return (
    <div className="w-full min-h-screen bg-brand-900 flex flex-col items-center justify-center text-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-brand-800/50 blur-3xl"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-800/30 blur-3xl"></div>
      </div>
      
      <div className="z-10 flex flex-col items-center animate-fade-in-up text-center max-w-md px-6">
        <div className="bg-white p-6 rounded-3xl shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-500">
          <Logo className="w-24 h-24 text-brand-800" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-white">Style Your Business</h1>
        <p className="text-brand-100 text-lg mb-10 leading-relaxed">
          Manage inventory, track sales, and grow your clothing brand.
        </p>
        
        <Link 
          to="/login"
          className="w-full py-4 bg-white text-brand-900 rounded-2xl font-bold text-lg shadow-lg hover:bg-gray-50 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
