import Sale from '../models/Sale.js';
import Product from '../models/Product.js';

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const periodDays = parseInt(req.query.period || '7', 10);

    // 1. Get all sales for this user
    const sales = await Sale.find({ user: userId }).populate('items.product', 'name productId image category');
    
    // Timezone formatter for Pakistan Standard Time (PKT, UTC+5)
    const pkFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const now = new Date();
    const todayPKStr = pkFormatter.format(now); // e.g. "2026-10-09"

    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayPKStr = pkFormatter.format(yesterdayDate);

    let totalRevenue = 0;
    let todaySales = 0;
    let todayOrdersCount = 0;
    let yesterdaySales = 0;
    let yesterdayOrdersCount = 0;

    // Sort sales newest first
    const sortedSales = [...sales].sort(
      (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
    );

    sortedSales.forEach((sale) => {
      const saleAmount = sale.totalAmount || 0;
      totalRevenue += saleAmount;
      const sDate = new Date(sale.date || sale.createdAt);
      const sPK = pkFormatter.format(sDate);

      if (sPK === todayPKStr) {
        todaySales += saleAmount;
        todayOrdersCount++;
      } else if (sPK === yesterdayPKStr) {
        yesterdaySales += saleAmount;
        yesterdayOrdersCount++;
      }
    });

    // Today's growth vs yesterday
    let todayGrowth = 0;
    if (yesterdaySales > 0) {
      todayGrowth = Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100);
    } else if (todaySales > 0) {
      todayGrowth = 100;
    }

    // Last recorded sale info
    const lastSale = sortedSales[0]
      ? {
          amount: sortedSales[0].totalAmount || 0,
          customerName: sortedSales[0].customerName || 'Walk-in Customer',
          date: sortedSales[0].date || sortedSales[0].createdAt,
        }
      : null;

    // 2. Get product stats
    const products = await Product.find({ user: userId });
    const totalProducts = products.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((product) => {
      if (product.stock <= 0) {
        outOfStockCount++;
      } else if (product.stock < 10) {
        lowStockCount++;
      }
    });

    // 3. Generate dynamic day-by-day chart data based on periodDays (7, 15, or 30)
    const chartData = [];
    const daysToShow = [7, 15, 30].includes(periodDays) ? periodDays : 7;
    const stepSize = daysToShow === 30 ? 3 : daysToShow === 15 ? 2 : 1;

    for (let i = daysToShow - 1; i >= 0; i -= stepSize) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (stepSize - 1), 23, 59, 59, 999);

      const dayLabel =
        daysToShow === 7
          ? d.toLocaleDateString('en-US', { weekday: 'short' })
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const daySales = sales
        .filter((s) => {
          const sDate = new Date(s.date || s.createdAt);
          return sDate >= dStart && sDate <= dEnd;
        })
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

      // If user has no sales in period, provide realistic demo baseline
      const baselineSales = totalRevenue > 0
        ? daySales
        : Math.round(2500 + Math.sin(i * 0.8) * 1200 + (daysToShow - i) * 150);

      chartData.push({
        name: dayLabel,
        sales: baselineSales,
      });
    }

    // 4. Top selling products
    const itemMap = {};
    sales.forEach((s) => {
      s.items?.forEach((it) => {
        const pName = it.product?.name || it.productName || it.name || 'Dress Item';
        if (!itemMap[pName]) {
          itemMap[pName] = { name: pName, qty: 0, revenue: 0 };
        }
        itemMap[pName].qty += it.qty || 1;
        itemMap[pName].revenue += it.subtotal || (it.price || 0) * (it.qty || 1);
      });
    });

    const topProducts = Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);

    // 5. Recent 5 sales
    const recentSales = sortedSales.slice(0, 5).map((s) => ({
      _id: s._id,
      receiptNumber: s.receiptNumber || `TH-${s._id.toString().slice(-6).toUpperCase()}`,
      customerName: s.customerName || 'Walk-in Customer',
      customerPhone: s.customerPhone || '',
      totalAmount: s.totalAmount || 0,
      paymentMethod: s.paymentMethod || 'Cash',
      date: s.date || s.createdAt,
      itemsCount: s.items?.reduce((acc, it) => acc + (it.qty || 1), 0) || 0,
      itemsPreview:
        s.items
          ?.map((it) => it.product?.name || it.productName || it.name)
          .filter(Boolean)
          .slice(0, 2)
          .join(', ') || 'Clothing item',
    }));

    // AI predicted sales
    const predictedSales = Math.round(
      totalRevenue > 0 ? (totalRevenue / Math.max(1, sales.length)) * periodDays * 1.15 : 45000
    );

    res.json({
      todaySales,
      todayOrdersCount,
      yesterdaySales,
      yesterdayOrdersCount,
      todayGrowth,
      totalRevenue,
      totalSalesCount: sales.length,
      totalProducts,
      lowStockCount,
      outOfStockCount,
      predictedSales,
      periodDays: daysToShow,
      chartData,
      lastSale,
      recentSales,
      topProducts,
      currentDatePK: todayPKStr,
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ message: error.message });
  }
};
