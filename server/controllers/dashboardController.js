import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import { getSalesChart } from '../utils/dashboard.js';

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

    const { chartData, periodRevenue, periodDays: daysToShow } = getSalesChart(sales, periodDays, now);

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
      periodRevenue,
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
