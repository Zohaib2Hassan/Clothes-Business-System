import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Notification from '../models/Notification.js';

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
export const getSales = async (req, res) => {
  try {
    const query = { user: req.user._id };
    if (req.query.customerId) {
      query.customer = req.query.customerId;
    }
    const sales = await Sale.find(query).populate('items.product', 'name productId image');
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a sale
// @route   POST /api/sales
// @access  Private
export const createSale = async (req, res) => {
  try {
    const { 
      customerId, 
      customerName, 
      customerPhone, 
      customerAddress, 
      date, 
      items, 
      subtotal, 
      discount, 
      totalAmount, 
      paymentStatus 
    } = req.body;

    if (!items || items.length === 0) {
      res.status(400);
      throw new Error('No order items');
    }

    let finalCustomerId = customerId;
    let finalCustomerName = customerName?.trim() || 'Walk-in Customer';

    // Auto-create or link customer if entered manually
    if (!finalCustomerId && finalCustomerName && finalCustomerName !== 'Walk-in Customer') {
      let cust = null;
      if (customerPhone && customerPhone.trim()) {
        cust = await Customer.findOne({ user: req.user._id, phone: customerPhone.trim() });
      }
      if (!cust) {
        cust = await Customer.findOne({ user: req.user._id, name: finalCustomerName });
      }
      if (!cust) {
        cust = await Customer.create({
          user: req.user._id,
          name: finalCustomerName,
          phone: customerPhone ? customerPhone.trim() : '',
          address: customerAddress ? customerAddress.trim() : '',
          totalSpent: 0,
          totalOrders: 0,
        });
      }
      finalCustomerId = cust._id;
    }

    // Process items: auto-link or auto-create products if added manually
    const processedItems = [];
    for (const item of items) {
      let productId = item.product;
      let pName = (item.productName || item.name || '').trim();

      let product = null;
      if (productId && mongoose.Types.ObjectId.isValid(productId)) {
        product = await Product.findById(productId);
      }

      // If no DB product found by ID, search by name
      if (!product && pName) {
        product = await Product.findOne({
          user: req.user._id,
          name: { $regex: new RegExp(`^${pName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });
      }

      // If still not found and saveToInventory is requested (or default true), auto-create product in inventory!
      if (!product && pName && item.saveToInventory !== false) {
        const count = await Product.countDocuments({ user: req.user._id });
        const code = `PRD-${Date.now().toString().slice(-4)}${count + 1}`;
        product = await Product.create({
          user: req.user._id,
          productId: code,
          name: pName,
          category: item.category || 'Clothing',
          price: Number(item.price) || 0,
          costPrice: Math.round((Number(item.price) || 0) * 0.7),
          stock: Math.max(0, 50 - (Number(item.qty) || 1)),
        });
      }

      if (product) {
        productId = product._id;
        pName = product.name;
        // Deduct stock if product existed previously
        if (product.createdAt && (Date.now() - new Date(product.createdAt).getTime() > 1000)) {
          product.stock = Math.max(0, product.stock - (Number(item.qty) || 1));
          await product.save();
        }

        if (product.stock <= 5) {
          await Notification.create({
            user: req.user._id,
            title: 'Low Stock Alert',
            message: `${product.name} is running low (${product.stock} units left).`,
            type: 'stock',
            link: '/inventory',
            isRead: false,
          });
        }
      }

      processedItems.push({
        product: productId || undefined,
        productName: pName,
        qty: Number(item.qty) || 1,
        price: Number(item.price) || 0,
      });
    }

    // Resolve sale date properly in Pakistan Timezone (UTC+05:00)
    let finalSaleDate = new Date();
    if (date) {
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
        const timeFormatter = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Karachi',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
        const currentTimePK = timeFormatter.format(new Date());
        finalSaleDate = new Date(`${date.trim()}T${currentTimePK}+05:00`);
      } else {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          finalSaleDate = parsed;
        }
      }
    }

    const sale = new Sale({
      user: req.user._id,
      customer: finalCustomerId || undefined,
      customerName: finalCustomerName,
      customerPhone: customerPhone ? customerPhone.trim() : '',
      date: finalSaleDate,
      items: processedItems,
      subtotal,
      discount,
      totalAmount,
      paymentStatus: paymentStatus || 'Paid'
    });

    const createdSale = await sale.save();

    // Update customer stats if customerId provided or found
    if (finalCustomerId) {
      const customer = await Customer.findById(finalCustomerId);
      if (customer && customer.user.toString() === req.user._id.toString()) {
        customer.totalSpent += Number(totalAmount);
        customer.totalOrders += 1;
        await customer.save();
      }
    }

    // Create new sale notification
    await Notification.create({
      user: req.user._id,
      title: 'New Sale Recorded',
      message: `Sale of Rs. ${Number(totalAmount).toLocaleString()} recorded for ${finalCustomerName}.`,
      type: 'sale',
      link: '/sales',
      isRead: false,
    });

    res.status(201).json(createdSale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a sale and restore stock + customer stats
// @route   DELETE /api/sales/:id
// @access  Private
export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale || sale.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Restore stock for each product in the sale
    for (const item of sale.items) {
      if (item.product) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock = product.stock + (item.qty || 0);
          await product.save();
        }
      }
    }

    // Reverse customer stats if a customer was linked
    if (sale.customer) {
      const customer = await Customer.findById(sale.customer);
      if (customer && customer.user.toString() === req.user._id.toString()) {
        customer.totalSpent = Math.max(0, customer.totalSpent - (sale.totalAmount || 0));
        customer.totalOrders = Math.max(0, customer.totalOrders - 1);
        await customer.save();
      }
    }

    await Sale.deleteOne({ _id: sale._id });
    res.json({ message: 'Sale removed, stock restored' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
