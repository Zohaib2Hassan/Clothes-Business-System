import { 
  TrendingUp, 
  Plus, 
  Bot, 
  Package, 
  ShoppingBag, 
  Coins, 
  Calendar, 
  Clock, 
  ArrowUpRight, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Store, 
  Receipt, 
  Shirt, 
  ChevronRight,
  TrendingDown,
  Layers
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { authFetch } from '../../utils/api';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { formatPKDate, formatPKTime, getPKCurrentDate } from '../../utils/date';
import clsx from 'clsx';

interface DashboardStats {
  todaySales: number;
  todayOrdersCount: number;
  yesterdaySales: number;
  yesterdayOrdersCount: number;
  todayGrowth: number;
  totalRevenue: number;
  totalSalesCount: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  predictedSales: number;
  chartData: Array<{ name: string; sales: number }>;
  lastSale?: {
    amount: number;
    customerName: string;
    date: string;
  } | null;
  recentSales?: Array<{
    _id: string;
    receiptNumber: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    paymentMethod: string;
    date: string;
    itemsCount: number;
    itemsPreview: string;
  }>;
  topProducts?: Array<{
    name: string;
    qty: number;
    revenue: number;
  }>;
  currentDatePK?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [period, setPeriod] = useState<7 | 15 | 30>(7);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayOrdersCount: 0,
    yesterdaySales: 0,
    yesterdayOrdersCount: 0,
    todayGrowth: 0,
    totalRevenue: 0,
    totalSalesCount: 0,
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    predictedSales: 0,
    chartData: [
      { name: 'Mon', sales: 0 },
      { name: 'Tue', sales: 0 },
      { name: 'Wed', sales: 0 },
      { name: 'Thu', sales: 0 },
      { name: 'Fri', sales: 0 },
      { name: 'Sat', sales: 0 },
      { name: 'Sun', sales: 0 },
    ],
    recentSales: [],
    topProducts: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await authFetch(`/api/dashboard/stats?period=${period}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [period]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Find max sales day in chart
  const maxDaySale = stats.chartData.reduce((max, cur) => Math.max(max, cur.sales || 0), 0);
  const avgChartSales = stats.chartData.length
    ? Math.round(stats.chartData.reduce((sum, c) => sum + (c.sales || 0), 0) / stats.chartData.length)
    : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* ========================================================================= */}
      {/* 1. CREATIVE BOUTIQUE HERO BANNER                                          */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-950 via-brand-900 to-emerald-950 text-white p-6 sm:p-8 shadow-xl border border-brand-800/50">
        {/* Decorative background glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/15 text-emerald-300">
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                Threadly Boutique
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Store Live & Open
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono text-gray-300 bg-black/20">
                <Calendar className="w-3 h-3 text-gray-400" />
                {formatPKDate(new Date())}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {getGreeting()}, <span className="text-emerald-400">{user?.name || 'Naveed'}</span> 👋
            </h1>
            <p className="text-sm text-gray-300 max-w-xl">
              Track real-time garment sales, manage clothing inventory, and monitor boutique growth across Pakistan.
            </p>
          </div>

          {/* Quick Header Launch Action Buttons */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link to="/pos">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-brand-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 gap-2 cursor-pointer transition-all hover:scale-[1.02]">
                <Receipt className="w-4 h-4 text-brand-950" />
                POS Counter
              </Button>
            </Link>
            <Link to="/sales/add">
              <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-4 py-2.5 rounded-xl backdrop-blur-md gap-2 cursor-pointer transition-all">
                <Plus className="w-4 h-4 text-emerald-400" />
                New Sale
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CREATIVE STATS KPI CARDS (Accurate Today's Sale & Insights)             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* CARD 1: TODAY'S SALES */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 p-5 shadow-xs hover:shadow-xl transition-all relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                Today's Sales
              </span>
              {stats.todaySales > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <TrendingUp className="w-3 h-3" />
                  {stats.todayGrowth > 0 ? `+${stats.todayGrowth}%` : 'Active'}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  0 Orders Today
                </span>
              )}
            </div>

            <div className="mb-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-mono tracking-tight">
                Rs. {stats.todaySales.toLocaleString()}
              </h2>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
            {stats.todaySales > 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {stats.todayOrdersCount} order{stats.todayOrdersCount === 1 ? '' : 's'} recorded today
              </span>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-gray-400 dark:text-slate-500 text-[11px] truncate">
                  {stats.lastSale ? (
                    <>Last: <strong className="text-gray-600 dark:text-gray-300">Rs. {stats.lastSale.amount.toLocaleString()}</strong> ({formatPKDate(stats.lastSale.date)})</>
                  ) : (
                    'Ready for today\'s first sale'
                  )}
                </span>
                <Link
                  to="/sales/add"
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 flex items-center gap-0.5 ml-1 shrink-0 hover:underline"
                >
                  + Add <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: TOTAL REVENUE */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 p-5 shadow-xs hover:shadow-xl transition-all relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-900 to-emerald-700" />
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-brand-800 dark:text-emerald-400" />
                Total Revenue
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-brand-50 text-brand-800 dark:bg-slate-800 dark:text-emerald-400 border border-brand-100 dark:border-slate-700">
                {stats.totalSalesCount || 7} Orders
              </span>
            </div>

            <div className="mb-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-mono tracking-tight">
                Rs. {stats.totalRevenue.toLocaleString()}
              </h2>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
            <span>Boutique gross turnover</span>
            <Link to="/sales" className="text-brand-800 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-0.5">
              History <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* CARD 3: PRODUCTS & STOCK HEALTH */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 p-5 shadow-xs hover:shadow-xl transition-all relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600" />
                Clothing Catalog
              </span>
              {stats.lowStockCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-3 h-3" />
                  {stats.lowStockCount} Low Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Healthy
                </span>
              )}
            </div>

            <div className="mb-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-mono tracking-tight">
                {stats.totalProducts} <span className="text-sm font-semibold text-gray-400 font-sans">Products</span>
              </h2>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
            <span>{stats.lowStockCount} low stock alerts</span>
            <Link to="/products" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-0.5">
              Inventory <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* CARD 4: AI PREDICTED SALES */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 p-5 shadow-xs hover:shadow-xl transition-all relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Predicted Sales
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                AI Forecast
              </span>
            </div>

            <div className="mb-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-mono tracking-tight">
                Rs. {stats.predictedSales.toLocaleString()}
              </h2>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
            <span>Forecast for {period} days</span>
            <Link to="/predictions" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-0.5">
              Insights <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE SALES CHART & TOP CLOTHING ITEMS SPLIT                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Dynamic Area Chart (2 Cols) */}
        <Card className="lg:col-span-2 border-gray-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4.5 border-b border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Sales Performance Trend</h3>
                <p className="text-xs text-gray-400">Daily business revenue overview</p>
              </div>
            </div>

            {/* Period Filter Buttons */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
              {([7, 15, 30] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    period === p
                      ? 'bg-white dark:bg-slate-900 text-brand-900 dark:text-emerald-400 shadow-xs'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  {p} Days
                </button>
              ))}
            </div>
          </div>

          <CardContent className="p-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    dy={8}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(val) => `Rs. ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      backgroundColor: '#0f172a',
                      color: '#fff',
                      border: 'none', 
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' 
                    }}
                    formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#059669" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#salesGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Chart KPI Footer */}
            <div className="grid grid-cols-2 pt-4 mt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Peak Volume:</span>
                <span className="font-bold font-mono text-gray-900 dark:text-white">Rs. {maxDaySale.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-gray-400">Avg Run-Rate:</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">Rs. {avgChartSales.toLocaleString()}/day</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Top Selling Clothing Items */}
        <Card className="border-gray-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-xl">
                  <Shirt className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Top Selling Garments</h3>
              </div>
              <Link to="/products" className="text-xs font-semibold text-brand-800 dark:text-emerald-400 hover:underline">
                Catalog
              </Link>
            </div>

            <CardContent className="p-5 space-y-4">
              {stats.topProducts && stats.topProducts.length > 0 ? (
                stats.topProducts.map((prod, idx) => {
                  const maxRev = stats.topProducts![0]?.revenue || 1;
                  const pct = Math.round((prod.revenue / maxRev) * 100);

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="font-bold text-gray-800 dark:text-white truncate max-w-[160px] capitalize">
                          {prod.name}
                        </span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          Rs. {prod.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono shrink-0">{prod.qty} pcs</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-gray-400 text-xs">
                  <Shirt className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No product sales recorded yet.
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-4 bg-gray-50/80 dark:bg-slate-800/40 border-t border-gray-100 dark:border-slate-800">
            <Link to="/inventory">
              <Button variant="outline" size="sm" className="w-full text-xs font-bold gap-1.5 justify-center">
                <Layers className="w-3.5 h-3.5" />
                Manage Garment Inventory
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 4. RECENT TRANSACTIONS LIVE FEED & QUICK LAUNCHPAD                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Recent Boutique Sales Feed (2 Cols) */}
        <Card className="lg:col-span-2 border-gray-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4.5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-brand-50 dark:bg-slate-800 text-brand-800 dark:text-emerald-400 rounded-xl">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Recent Sales Feed</h3>
                <p className="text-xs text-gray-400">Latest customer checkouts & receipts</p>
              </div>
            </div>
            <Link to="/sales">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1 cursor-pointer">
                View All Sales <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <CardContent className="p-0">
            {stats.recentSales && stats.recentSales.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {stats.recentSales.map((sale) => (
                  <div 
                    key={sale._id}
                    onClick={() => navigate('/sales')}
                    className="p-4 flex items-center justify-between hover:bg-gray-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-900 to-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {(sale.customerName || 'W').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {sale.customerName}
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-500 font-semibold">
                            {sale.paymentMethod}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {sale.itemsPreview} • <span className="font-mono">{formatPKTime(sale.date)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <div className="font-mono font-bold text-sm text-gray-900 dark:text-white">
                        Rs. {sale.totalAmount.toLocaleString()}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {formatPKDate(sale.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 text-xs">
                No recent transactions recorded.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Side: Creative Launchpad Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Quick Launchpad</h3>
            <span className="text-xs text-gray-400">Fast Shortcuts</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Action 1: POS Screen */}
            <div
              onClick={() => navigate('/pos')}
              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 transition-all cursor-pointer flex items-center justify-between group hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    POS Cash Counter
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Barcode checkout & instant billing</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>

            {/* Action 2: Add Sale */}
            <div
              onClick={() => navigate('/sales/add')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 hover:border-brand-500/50 transition-all cursor-pointer flex items-center justify-between group hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-brand-100 dark:bg-slate-800 text-brand-900 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-800 dark:group-hover:text-emerald-400 transition-colors">
                    Record New Sale
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Custom order or wholesale entry</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-brand-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>

            {/* Action 3: Add Product */}
            <div
              onClick={() => navigate('/products/add')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-between group hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-slate-800 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    Add Apparel Item
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400">New clothing style, color & size</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>

            {/* Action 4: AI Advisor */}
            <div
              onClick={() => navigate('/ai-assistant')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer flex items-center justify-between group hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-slate-800 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">
                    AI Fashion Advisor
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Stock predictions & pricing tips</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
