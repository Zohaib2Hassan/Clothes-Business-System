import { Download, FileSpreadsheet, FilePlus2, Calendar, RefreshCw, Layers, TrendingUp, CheckCircle2, Package } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { authFetch } from '../../utils/api';
import clsx from 'clsx';

const TABS = [
  'Daily Report', 
  'Weekly Report', 
  'Monthly Report',
  'Inventory Report', 
  'Expense Report', 
  'Customer Report', 
  'Product Performance'
] as const;

type ReportTab = typeof TABS[number];
type PeriodFilter = '7' | '15' | '30' | '90' | '365' | 'all';

const PIE_COLORS = ['#1E3A2A', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Reports() {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any>({ expenses: [], summary: { totalAmount: 0 } });
  const [productsData, setProductsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active filters
  const [activeTab, setActiveTab] = useState<ReportTab>('Daily Report');
  const [period, setPeriod] = useState<PeriodFilter>('30');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, expensesRes, productsRes] = await Promise.all([
        authFetch('/api/sales'),
        authFetch('/api/expenses'),
        authFetch('/api/products'),
      ]);

      if (salesRes.ok) {
        const data = await salesRes.json();
        setSalesData(Array.isArray(data) ? data : []);
      }
      if (expensesRes.ok) {
        const data = await expensesRes.json();
        setExpenseData(data || { expenses: [], summary: { totalAmount: 0 } });
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProductsData(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch report data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateReport = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    const label = period === '7' ? 'Last 7 Days' : period === '15' ? 'Last 15 Days' : period === '30' ? 'Last 30 Days' : period === '90' ? 'Last 90 Days' : period === '365' ? 'This Year' : 'All Time';
    setFeedbackMessage(`Report generated for ${label} (${activeTab})`);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Filter sales and expenses by the chosen period
  const { filteredSales, filteredExpenses } = useMemo(() => {
    if (period === 'all') {
      return { filteredSales: salesData, filteredExpenses: expenseData.expenses || [] };
    }

    const now = new Date();
    const days = parseInt(period, 10);
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const fSales = salesData.filter((s) => {
      const d = new Date(s.date || s.createdAt);
      return d >= cutoffDate;
    });

    const fExpenses = (expenseData.expenses || []).filter((e: any) => {
      const d = new Date(e.date || e.createdAt);
      return d >= cutoffDate;
    });

    return { filteredSales: fSales, filteredExpenses: fExpenses };
  }, [salesData, expenseData, period]);

  // Aggregate Metrics
  const totalSales = filteredSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalOrders = filteredSales.length;
  const totalExpenses = filteredExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  const totalProfit = totalSales - totalExpenses;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  // Group sales by day
  const dailyBreakdown = useMemo(() => {
    const map: Record<string, { orders: number; sales: number; dateObj: Date }> = {};
    
    filteredSales.forEach((sale) => {
      const d = new Date(sale.date || sale.createdAt);
      const dateKey = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      if (!map[dateKey]) {
        map[dateKey] = { orders: 0, sales: 0, dateObj: d };
      }
      map[dateKey].orders++;
      map[dateKey].sales += sale.totalAmount || 0;
    });

    const rows = Object.entries(map)
      .sort((a, b) => b[1].dateObj.getTime() - a[1].dateObj.getTime())
      .map(([date, data]) => {
        const estProfit = Math.round(data.sales * 0.38);
        const dayExpense = filteredExpenses.length > 0
          ? Math.round(totalExpenses / Math.max(Object.keys(map).length, 1))
          : 0;
        return {
          date,
          orders: data.orders,
          sales: data.sales,
          profit: estProfit,
          expenses: dayExpense,
        };
      });

    return rows;
  }, [filteredSales, filteredExpenses, totalExpenses]);

  // Group by week for Weekly Report
  const weeklyBreakdown = useMemo(() => {
    const map: Record<string, { orders: number; sales: number; timestamp: number }> = {};

    filteredSales.forEach((sale) => {
      const d = new Date(sale.date || sale.createdAt);
      // Start of week (Sunday)
      const day = d.getDay();
      const diff = d.getDate() - day;
      const weekStart = new Date(d.setDate(diff));
      const weekLabel = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

      if (!map[weekLabel]) {
        map[weekLabel] = { orders: 0, sales: 0, timestamp: weekStart.getTime() };
      }
      map[weekLabel].orders++;
      map[weekLabel].sales += sale.totalAmount || 0;
    });

    return Object.entries(map)
      .sort((a, b) => b[1].timestamp - a[1].timestamp)
      .map(([week, val]) => ({
        week,
        orders: val.orders,
        sales: val.sales,
        profit: Math.round(val.sales * 0.38),
        expenses: Math.round(totalExpenses / Math.max(Object.keys(map).length, 1)),
      }));
  }, [filteredSales, totalExpenses]);

  // Group by month for Monthly Report
  const monthlyBreakdown = useMemo(() => {
    const map: Record<string, { orders: number; sales: number; timestamp: number }> = {};

    filteredSales.forEach((sale) => {
      const d = new Date(sale.date || sale.createdAt);
      const monthLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!map[monthLabel]) {
        map[monthLabel] = { orders: 0, sales: 0, timestamp: new Date(d.getFullYear(), d.getMonth(), 1).getTime() };
      }
      map[monthLabel].orders++;
      map[monthLabel].sales += sale.totalAmount || 0;
    });

    return Object.entries(map)
      .sort((a, b) => b[1].timestamp - a[1].timestamp)
      .map(([month, val]) => ({
        month,
        orders: val.orders,
        sales: val.sales,
        profit: Math.round(val.sales * 0.38),
        expenses: Math.round(totalExpenses / Math.max(Object.keys(map).length, 1)),
      }));
  }, [filteredSales, totalExpenses]);

  // Chart data from breakdown
  const chartData = useMemo(() => {
    return dailyBreakdown.slice(0, 14).map((row) => ({
      name: row.date.split(',')[0],
      sales: row.sales,
      expenses: row.expenses,
    })).reverse();
  }, [dailyBreakdown]);

  // Inventory valuation & metrics
  const inventoryStats = useMemo(() => {
    const totalStock = productsData.reduce((sum, p) => sum + (p.stock || 0), 0);
    const retailValuation = productsData.reduce((sum, p) => sum + (p.stock || 0) * (p.price || 0), 0);
    const lowStockItems = productsData.filter((p) => (p.stock || 0) <= 8);
    const categoryCounts: Record<string, number> = {};
    productsData.forEach((p) => {
      const cat = p.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + (p.stock || 0);
    });

    return { totalStock, retailValuation, lowStockItems, categoryCounts };
  }, [productsData]);

  // Expense breakdown by category
  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e: any) => {
      const cat = e.category || 'Other';
      map[cat] = (map[cat] || 0) + (e.amount || 0);
    });
    return Object.entries(map).map(([name, amount]) => ({
      name,
      amount,
      pct: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalExpenses]);

  // Product performance ranking
  const productPerformance = useMemo(() => {
    const map: Record<string, { name: string; category: string; unitsSold: number; revenue: number }> = {};
    filteredSales.forEach((sale) => {
      (sale.items || []).forEach((item: any) => {
        const id = item.product?._id || item.product || item.name || 'Unknown';
        const name = item.product?.name || item.name || 'Garment Item';
        const category = item.product?.category || 'Garments';
        if (!map[id]) {
          map[id] = { name, category, unitsSold: 0, revenue: 0 };
        }
        map[id].unitsSold += item.qty || 0;
        map[id].revenue += (item.price || 0) * (item.qty || 0);
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  // Customer performance ranking
  const customerPerformance = useMemo(() => {
    const map: Record<string, { name: string; phone: string; orders: number; spent: number }> = {};
    filteredSales.forEach((sale) => {
      const name = sale.customerName || 'Walk-in Customer';
      const phone = sale.customerPhone || 'N/A';
      if (!map[name]) {
        map[name] = { name, phone, orders: 0, spent: 0 };
      }
      map[name].orders++;
      map[name].spent += sale.totalAmount || 0;
    });
    return Object.values(map).sort((a, b) => b.spent - a.spent);
  }, [filteredSales]);

  // Handle Export CSV
  const handleExportCSV = () => {
    const periodLabel = period === '7' ? '7days' : period === '15' ? '15days' : period === '30' ? '30days' : period === '90' ? '90days' : period === '365' ? '1year' : 'all';
    let headers = '';
    let rows = '';

    if (activeTab === 'Daily Report') {
      headers = 'Date,Orders,Sales (PKR),Est Profit (PKR),Expenses (PKR)\n';
      rows = dailyBreakdown.map((r) => `"${r.date}",${r.orders},${r.sales},${r.profit},${r.expenses}`).join('\n');
    } else if (activeTab === 'Weekly Report') {
      headers = 'Week,Orders,Sales (PKR),Est Profit (PKR),Expenses (PKR)\n';
      rows = weeklyBreakdown.map((r) => `"${r.week}",${r.orders},${r.sales},${r.profit},${r.expenses}`).join('\n');
    } else if (activeTab === 'Monthly Report') {
      headers = 'Month,Orders,Sales (PKR),Est Profit (PKR),Expenses (PKR)\n';
      rows = monthlyBreakdown.map((r) => `"${r.month}",${r.orders},${r.sales},${r.profit},${r.expenses}`).join('\n');
    } else if (activeTab === 'Inventory Report') {
      headers = 'Product,Category,Stock (Units),Price (PKR),Total Valuation (PKR)\n';
      rows = productsData.map((p) => `"${p.name}","${p.category || 'General'}",${p.stock || 0},${p.price || 0},${(p.stock || 0) * (p.price || 0)}`).join('\n');
    } else if (activeTab === 'Expense Report') {
      headers = 'Expense Category,Amount (PKR),Percentage\n';
      rows = expenseBreakdown.map((e) => `"${e.name}",${e.amount},${e.pct}%`).join('\n');
    } else if (activeTab === 'Customer Report') {
      headers = 'Customer Name,Contact,Orders Placed,Total Spent (PKR),Avg Order (PKR)\n';
      rows = customerPerformance.map((c) => `"${c.name}","${c.phone}",${c.orders},${c.spent},${c.orders > 0 ? Math.round(c.spent / c.orders) : 0}`).join('\n');
    } else {
      // Product Performance
      headers = 'Product Name,Category,Units Sold,Revenue (PKR)\n';
      rows = productPerformance.map((p) => `"${p.name}","${p.category}",${p.unitsSold},${p.revenue}`).join('\n');
    }

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Threadly_${activeTab.replace(/\s+/g, '_')}_${periodLabel}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedbackMessage(`Exported ${activeTab} as CSV`);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {feedbackMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-brand-900 text-white shadow-xl text-sm font-medium border border-brand-700 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>Business Reports</span>
            <span className="text-xs bg-brand-50 text-brand-800 font-semibold px-2 py-0.5 rounded-full border border-brand-100">
              Live Financials
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Detailed auditing, multi-interval breakdown, and inventory valuation for your clothing brand.
          </p>
        </div>

        {/* Controls: Time Period Filter & Generate Report */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
              className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer pr-2"
            >
              <option value="7">Last 7 Days (Week)</option>
              <option value="15">Last 15 Days (Fortnight)</option>
              <option value="30">Last 30 Days (Month)</option>
              <option value="90">Last 90 Days (Quarter)</option>
              <option value="365">This Year (365d)</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <Button
            variant="primary"
            onClick={handleGenerateReport}
            disabled={refreshing}
            className="gap-2 bg-brand-900 hover:bg-brand-800 text-white shadow-sm"
          >
            <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
            <span>Generate Report</span>
          </Button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
              activeTab === tab
                ? "bg-brand-900 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-brand-900 to-brand-800 text-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-brand-200 text-xs font-semibold uppercase tracking-wider">
                  Total Sales ({period === 'all' ? 'All' : `${period}d`})
                </p>
                <h3 className="text-2xl font-bold mt-1">Rs. {totalSales.toLocaleString()}</h3>
              </div>
              <div className="bg-white/10 p-2 rounded-xl">
                <FilePlus2 className="w-5 h-5 text-emerald-300" />
              </div>
            </div>
            <div className="mt-3 text-xs text-brand-200">
              Across <span className="font-semibold text-white">{totalOrders}</span> recorded customer orders
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Net Profit</p>
                <h3 className={clsx("text-2xl font-bold mt-1", totalProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
                  Rs. {totalProfit.toLocaleString()}
                </h3>
              </div>
              <div className="bg-emerald-50 p-2 rounded-xl">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Gross margin: <span className="font-semibold text-gray-800">{totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Expenses</p>
                <h3 className="text-2xl font-bold text-orange-600 mt-1">Rs. {totalExpenses.toLocaleString()}</h3>
              </div>
              <div className="bg-orange-50 p-2 rounded-xl">
                <Layers className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <span className="font-semibold text-gray-800">{filteredExpenses.length}</span> expense entries logged
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Average Order</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">Rs. {avgOrderValue.toLocaleString()}</h3>
              </div>
              <div className="bg-blue-50 p-2 rounded-xl">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Per receipt transaction
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Subheader & Export actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{activeTab}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Filtered for {period === '7' ? 'Last 7 Days' : period === '15' ? 'Last 15 Days' : period === '30' ? 'Last 30 Days' : period === '90' ? 'Last 90 Days' : period === '365' ? 'This Year' : 'All Historical Data'}
            </p>
          </div>
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs text-gray-700 bg-white hover:bg-gray-50 border-gray-200"
              onClick={handleExportCSV}
            >
              <Download className="w-4 h-4 text-gray-500" />
              <span>Download CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs text-gray-700 bg-white hover:bg-gray-50 border-gray-200"
              onClick={handleExportCSV}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </Button>
          </div>
        </div>

        {/* Tab 1: Daily Report */}
        {activeTab === 'Daily Report' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-3">Daily Performance Breakdown</h3>
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-5 bg-gray-50/90 p-3 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase">
                  <div className="col-span-1">Date</div>
                  <div className="text-center">Orders</div>
                  <div className="text-right">Sales</div>
                  <div className="text-right">Est Profit</div>
                  <div className="text-right">Expenses</div>
                </div>
                <div className="divide-y divide-gray-100 max-h-[360px] overflow-y-auto">
                  {loading ? (
                    <div className="p-6 text-center text-gray-400 text-sm">Loading daily figures...</div>
                  ) : dailyBreakdown.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">No sales found in this period.</div>
                  ) : (
                    dailyBreakdown.map((row) => (
                      <div key={row.date} className="grid grid-cols-5 p-3 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                        <div className="font-medium text-gray-900 truncate">{row.date}</div>
                        <div className="text-center">{row.orders}</div>
                        <div className="text-right font-medium">Rs. {row.sales.toLocaleString()}</div>
                        <div className="text-right text-emerald-600 font-medium">Rs. {row.profit.toLocaleString()}</div>
                        <div className="text-right text-orange-600">Rs. {row.expenses.toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Daily Chart */}
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-3">Sales vs Expense Trajectory</h3>
              <div className="h-[360px] border border-gray-100 rounded-xl p-4 bg-gray-50/40">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(val) => `${val / 1000}k`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px -2px rgb(0 0 0 / 0.1)' }} 
                        formatter={(v: any) => [`Rs. ${Number(v).toLocaleString()}`, '']}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="sales" name="Sales (PKR)" fill="#1E3A2A" radius={[4, 4, 0, 0]} barSize={14} />
                      <Bar dataKey="expenses" name="Expenses (PKR)" fill="#F97316" radius={[4, 4, 0, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                    No sales recorded for this period to display.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Weekly Report */}
        {activeTab === 'Weekly Report' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Aggregated Weekly Summary</h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/90 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-100">
                    <th className="p-3">Period Window</th>
                    <th className="p-3 text-center">Total Orders</th>
                    <th className="p-3 text-right">Revenue (PKR)</th>
                    <th className="p-3 text-right">Est Profit (PKR)</th>
                    <th className="p-3 text-right">Allocated Expenses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {weeklyBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-400">No weekly records available.</td>
                    </tr>
                  ) : (
                    weeklyBreakdown.map((w) => (
                      <tr key={w.week} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-semibold text-gray-900">{w.week}</td>
                        <td className="p-3 text-center">{w.orders}</td>
                        <td className="p-3 text-right font-bold text-brand-900">Rs. {w.sales.toLocaleString()}</td>
                        <td className="p-3 text-right text-emerald-600 font-semibold">Rs. {w.profit.toLocaleString()}</td>
                        <td className="p-3 text-right text-orange-600">Rs. {w.expenses.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Monthly Report */}
        {activeTab === 'Monthly Report' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Month-by-Month Statement</h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/90 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-100">
                    <th className="p-3">Month</th>
                    <th className="p-3 text-center">Orders</th>
                    <th className="p-3 text-right">Gross Sales (PKR)</th>
                    <th className="p-3 text-right">Est Profit (PKR)</th>
                    <th className="p-3 text-right">Expenses (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {monthlyBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-400">No monthly records in this range.</td>
                    </tr>
                  ) : (
                    monthlyBreakdown.map((m) => (
                      <tr key={m.month} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-semibold text-gray-900">{m.month}</td>
                        <td className="p-3 text-center">{m.orders}</td>
                        <td className="p-3 text-right font-bold text-brand-900">Rs. {m.sales.toLocaleString()}</td>
                        <td className="p-3 text-right text-emerald-600 font-semibold">Rs. {m.profit.toLocaleString()}</td>
                        <td className="p-3 text-right text-orange-600">Rs. {m.expenses.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Inventory Report */}
        {activeTab === 'Inventory Report' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                <span className="text-xs text-gray-500 uppercase font-semibold">Total Stock Units</span>
                <h4 className="text-2xl font-bold text-gray-900 mt-1">{inventoryStats.totalStock} units</h4>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                <span className="text-xs text-gray-500 uppercase font-semibold">Total Inventory Valuation</span>
                <h4 className="text-2xl font-bold text-brand-900 mt-1">Rs. {inventoryStats.retailValuation.toLocaleString()}</h4>
              </div>
              <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/60">
                <span className="text-xs text-amber-800 uppercase font-semibold">Low Stock Warnings</span>
                <h4 className="text-2xl font-bold text-amber-700 mt-1">{inventoryStats.lowStockItems.length} items</h4>
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/90 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-100">
                    <th className="p-3">Garment</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">Available Stock</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Asset Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productsData.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-semibold text-gray-900">{p.name}</td>
                      <td className="p-3 text-gray-500">{p.category || 'General'}</td>
                      <td className="p-3 text-center">
                        <span className={clsx("font-bold px-2 py-0.5 rounded", (p.stock || 0) <= 8 ? "bg-red-50 text-red-700" : "text-gray-900")}>
                          {p.stock || 0} units
                        </span>
                      </td>
                      <td className="p-3 text-right">Rs. {(p.price || 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-medium text-brand-900">
                        Rs. {((p.stock || 0) * (p.price || 0)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Expense Report */}
        {activeTab === 'Expense Report' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/90 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-100">
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Amount (PKR)</th>
                    <th className="p-3 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenseBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-gray-400">No expenses logged for this range.</td>
                    </tr>
                  ) : (
                    expenseBreakdown.map((e) => (
                      <tr key={e.name} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-semibold text-gray-900">{e.name}</td>
                        <td className="p-3 text-right font-bold text-orange-600">Rs. {e.amount.toLocaleString()}</td>
                        <td className="p-3 text-right text-gray-500">{e.pct}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/40 flex flex-col items-center justify-center">
              <h4 className="text-xs font-semibold text-gray-600 mb-2">Expense Allocation by Category</h4>
              {expenseBreakdown.length > 0 ? (
                <div className="w-full h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {expenseBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No expense distribution available</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Customer Report */}
        {activeTab === 'Customer Report' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Customer Order Frequency & Spending</h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/90 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-100">
                    <th className="p-3">Customer</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3 text-center">Orders</th>
                    <th className="p-3 text-right">Total Spent</th>
                    <th className="p-3 text-right">Average Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customerPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-400">No customer transactions found for this period.</td>
                    </tr>
                  ) : (
                    customerPerformance.map((c) => (
                      <tr key={c.name} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-semibold text-gray-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-900 flex items-center justify-center font-bold text-[10px]">
                            {c.name.charAt(0)}
                          </div>
                          <span>{c.name}</span>
                        </td>
                        <td className="p-3 text-gray-500">{c.phone}</td>
                        <td className="p-3 text-center font-medium">{c.orders}</td>
                        <td className="p-3 text-right font-bold text-brand-900">Rs. {c.spent.toLocaleString()}</td>
                        <td className="p-3 text-right text-emerald-600">
                          Rs. {(c.orders > 0 ? Math.round(c.spent / c.orders) : 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 7: Product Performance */}
        {activeTab === 'Product Performance' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Best Selling Garments & Revenue Contribution</h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/90 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-100">
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">Units Sold</th>
                    <th className="p-3 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-400">No product sales recorded in this interval.</td>
                    </tr>
                  ) : (
                    productPerformance.map((p) => (
                      <tr key={p.name} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-semibold text-gray-900">{p.name}</td>
                        <td className="p-3 text-gray-500">{p.category}</td>
                        <td className="p-3 text-center font-bold text-brand-900">{p.unitsSold} pcs</td>
                        <td className="p-3 text-right font-bold text-emerald-700">Rs. {p.revenue.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
