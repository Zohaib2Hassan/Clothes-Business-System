import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Shirt, 
  ShoppingBag, 
  Package, 
  Users, 
  CreditCard, 
  BarChart2, 
  Bot, 
  FileText, 
  Settings,
  Crown,
  BrainCircuit,
  Store,
} from 'lucide-react';
import clsx from 'clsx';
import Logo from './ui/Logo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const NAV_LINKS = [
  { key: 'nav.dashboard', name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { key: 'nav.pos', name: 'POS Counter', path: '/pos', icon: Store },
  { key: 'nav.products', name: 'Products', path: '/products', icon: Shirt },
  { key: 'nav.sales', name: 'Sales', path: '/sales', icon: ShoppingBag },
  { key: 'nav.inventory', name: 'Inventory', path: '/inventory', icon: Package },
  { key: 'nav.customers', name: 'Customers', path: '/customers', icon: Users },
  { key: 'nav.expenses', name: 'Expenses', path: '/expenses', icon: CreditCard },
  { key: 'nav.analytics', name: 'Analytics', path: '/analytics', icon: BarChart2 },
  { key: 'nav.predictions', name: 'Predictions', path: '/predictions', icon: BrainCircuit },
  { key: 'nav.aiAssistant', name: 'AI Assistant', path: '/ai-assistant', icon: Bot },
  { key: 'nav.reports', name: 'Reports', path: '/reports', icon: FileText },
  { key: 'nav.settings', name: 'Settings', path: '/profile', icon: Settings },
];

export default function Sidebar() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isPremium = user?.subscriptionTier === 'Premium' || user?.subscriptionTier === 'Annual';
  return (
    <aside className="w-[260px] h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col shrink-0 transition-colors">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3">
        <Logo className="text-brand-800 dark:text-brand-400 w-10 h-10 shrink-0" />
        <div>
          <h1 className="font-bold text-xl text-gray-900 dark:text-white tracking-tight leading-none">Threadly</h1>
          <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium tracking-widest uppercase mt-1">
            {t('nav.tagline', 'Style Your Business')}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 no-scrollbar">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                isActive 
                  ? "bg-brand-50 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 font-semibold" 
                  : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
              )
            }
          >
            <link.icon className="w-5 h-5 shrink-0" />
            <span className="truncate">{t(link.key, link.name)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Upgrade Banner */}
      <div className="p-4 mt-auto">
        <div className={clsx(
          "rounded-xl p-4 text-white relative overflow-hidden transition-all",
          isPremium ? "bg-gradient-to-br from-amber-600 to-amber-800" : "bg-brand-800"
        )}>
          {/* Decorative circles */}
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-amber-300" />
              <h3 className="font-semibold text-sm">
                {isPremium ? `${user?.subscriptionTier} Member` : t('nav.upgradeTitle', 'Upgrade to Premium')}
              </h3>
            </div>
            <p className="text-xs text-brand-100 mb-4 opacity-90 leading-relaxed">
              {isPremium
                ? 'All AI tools & unlimited products are fully active.'
                : t('nav.upgradeDesc', 'Get advanced AI insights and unlimited products.')}
            </p>
            <NavLink 
              to="/subscription" 
              className="block w-full bg-white text-gray-900 hover:bg-gray-50 py-2 rounded-lg text-xs font-bold transition-colors text-center shadow-xs"
            >
              {isPremium ? t('nav.manageSub', 'Manage Subscription') : t('nav.upgradeBtn', 'Upgrade Now')}
            </NavLink>
          </div>
        </div>
      </div>
    </aside>
  );
}
