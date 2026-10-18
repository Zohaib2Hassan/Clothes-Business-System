import Notification from '../models/Notification.js';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    let notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });

    // If user has no notifications yet, generate initial contextual notifications
    if (notifications.length === 0) {
      const initialAlerts = [];

      // Check if user has low stock products
      const lowStockProducts = await Product.find({ user: req.user._id, stock: { $lte: 10 } });
      if (lowStockProducts.length > 0) {
        initialAlerts.push({
          user: req.user._id,
          title: 'Low Stock Alert',
          message: `${lowStockProducts[0].name} has only ${lowStockProducts[0].stock} units left in stock. Reorder soon!`,
          type: 'stock',
          link: '/inventory',
          isRead: false,
        });
      } else {
        initialAlerts.push({
          user: req.user._id,
          title: 'Inventory Alert',
          message: 'Check reorder points for summer fabric collection before weekend rush.',
          type: 'stock',
          link: '/inventory',
          isRead: false,
        });
      }

      // Check recent sales
      const recentSales = await Sale.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(1);
      if (recentSales.length > 0) {
        initialAlerts.push({
          user: req.user._id,
          title: 'Recent Sale Completed',
          message: `Order completed for ${recentSales[0].customerName || 'Customer'} (Rs. ${recentSales[0].totalAmount?.toLocaleString()}).`,
          type: 'sale',
          link: '/sales',
          isRead: false,
        });
      }

      // Add AI assistant insight
      initialAlerts.push({
        user: req.user._id,
        title: 'AI Smart Insight',
        message: 'Kurta category shows 28% higher margin this week. Consider stocking additional variants.',
        type: 'ai',
        link: '/ai-assistant',
        isRead: false,
      });

      // Welcome alert
      initialAlerts.push({
        user: req.user._id,
        title: 'Welcome to Threadly',
        message: 'Your clothing assistant is connected. Track sales, expenses, and forecast inventory effortlessly.',
        type: 'system',
        link: '/dashboard',
        isRead: false,
      });

      await Notification.insertMany(initialAlerts);
      notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications
// @access  Private
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
