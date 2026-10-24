import { planReturn } from '../utils/returnPlan.js';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import Customer from '../models/Customer.js';
import Business from '../models/Business.js';
import Notification from '../models/Notification.js';
import HeldSale from '../models/HeldSale.js';
import Return from '../models/Return.js';
import { generateStructuredResponse } from '../services/geminiService.js';

// =========================================================================
// 1. POS CHECKOUT WITH ATOMIC STOCK DEDUCTION & BACKEND PRICE VALIDATION
// =========================================================================
export const posCheckout = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      items,
      discount = 0,
      discountType = 'flat',
      discountValue = 0,
      taxRate = 0,
      paymentMethod = 'Easypaisa',
      easypaisaDetails = {},
      cashTendered = 0,
      changeDue = 0,
      splitPayments = [],
      cardDetails = {},
      bankTransferDetails = {},
      note = '',
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty. Please add items to checkout.' });
    }

    const userId = req.user._id;

    // 1. Stock verification & atomic deduction using trusted DB data
    const verifiedItems = [];
    const productsToRevert = [];

    try {
      for (const item of items) {
        const qtyToDeduct = Math.max(1, Number(item.qty) || 1);
        let product = null;

        // Find product by MongoDB _id first
        if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
          product = await Product.findOne({ _id: item.productId, user: userId });
        }

        // If not found, try by SKU / productId string
        if (!product && (item.sku || item.productId)) {
          const skuCode = (item.sku || item.productId).toString().trim();
          product = await Product.findOne({ user: userId, productId: skuCode });
        }

        // If not found, try by exact name
        if (!product && item.name) {
          product = await Product.findOne({ user: userId, name: item.name.trim() });
        }

        if (product) {
          // Verify actual stock
          if (product.stock < qtyToDeduct) {
            throw new Error(
              `Only ${product.stock} units are currently available for "${product.name}". (Requested: ${qtyToDeduct})`
            );
          }

          // Atomically decrement stock
          const updatedProduct = await Product.findOneAndUpdate(
            { _id: product._id, stock: { $gte: qtyToDeduct } },
            { $inc: { stock: -qtyToDeduct } },
            { new: true }
          );

          if (!updatedProduct) {
            throw new Error(`Stock changed during transaction for "${product.name}". Please try again.`);
          }

          productsToRevert.push({ id: product._id, qty: qtyToDeduct });

          // Low stock alert if stock <= 5
          if (updatedProduct.stock <= 5) {
            await Notification.create({
              user: userId,
              title: 'Low Stock Alert (POS)',
              message: `${updatedProduct.name} is running low (${updatedProduct.stock} left in stock).`,
              type: 'stock',
              link: '/inventory',
              isRead: false,
            }).catch(() => {});
          }

          // Use real DB price for trusted calculation
          const trustedPrice = typeof product.price === 'number' ? product.price : (Number(item.price) || 0);

          verifiedItems.push({
            product: updatedProduct._id,
            productName: updatedProduct.name,
            productId: updatedProduct.productId || item.sku || '',
            size: item.size || '',
            color: item.color || '',
            qty: qtyToDeduct,
            price: trustedPrice,
            subtotal: trustedPrice * qtyToDeduct,
            returnedQty: 0,
          });
        } else {
          // Custom / manual catalog item
          const customPrice = Math.max(0, Number(item.price) || 0);
          verifiedItems.push({
            productName: item.name || 'Custom Garment',
            productId: item.sku || `ITEM-${Date.now().toString().slice(-4)}`,
            size: item.size || '',
            color: item.color || '',
            qty: qtyToDeduct,
            price: customPrice,
            subtotal: customPrice * qtyToDeduct,
            returnedQty: 0,
          });
        }
      }
    } catch (stockError) {
      // Rollback any successfully decremented items in this batch
      for (const rev of productsToRevert) {
        await Product.findByIdAndUpdate(rev.id, { $inc: { stock: rev.qty } }).catch(() => {});
      }
      return res.status(400).json({ message: stockError.message });
    }

    // 2. Authoritative backend price, discount, and tax calculation
    const computedSubtotal = verifiedItems.reduce((sum, it) => sum + it.subtotal, 0);

    // Validate and calculate discount
    let computedDiscount = 0;
    const numDiscountVal = Math.max(0, Number(discountValue) || 0);
    if (discountType === 'percentage') {
      computedDiscount = Math.round((computedSubtotal * Math.min(100, numDiscountVal)) / 100);
    } else {
      computedDiscount = Math.min(computedSubtotal, Math.round(numDiscountVal));
    }

    // Calculate tax
    const numTaxRate = Math.max(0, Number(taxRate) || 0);
    const taxableAmount = Math.max(0, computedSubtotal - computedDiscount);
    const computedTax = Math.round((taxableAmount * numTaxRate) / 100);

    // Grand total
    const computedTotalAmount = Math.max(0, taxableAmount + computedTax);

    // 3. Generate unique POS receipt number
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `TH-${datePrefix}-${randomSuffix}`;

    // 4. Handle Customer Linking or Creation
    let finalCustomerId = customerId;
    let finalCustomerName = customerName && customerName.trim() ? customerName.trim() : 'Walk-in Customer';

    if (!finalCustomerId && finalCustomerName !== 'Walk-in Customer') {
      let cust = null;
      if (customerPhone && customerPhone.trim()) {
        cust = await Customer.findOne({ user: userId, phone: customerPhone.trim() });
      }
      if (!cust) {
        cust = await Customer.findOne({ user: userId, name: finalCustomerName });
      }
      if (!cust) {
        cust = await Customer.create({
          user: userId,
          name: finalCustomerName,
          phone: customerPhone ? customerPhone.trim() : '',
          totalSpent: 0,
          totalOrders: 0,
        });
      }
      finalCustomerId = cust._id;
    }

    // 5. Create Sale Record
    const sale = new Sale({
      user: userId,
      customer: finalCustomerId || undefined,
      customerName: finalCustomerName,
      customerPhone: customerPhone ? customerPhone.trim() : '',
      date: new Date(),
      items: verifiedItems,
      subtotal: computedSubtotal,
      discount: computedDiscount,
      discountType: discountType || 'flat',
      discountValue: numDiscountVal,
      tax: computedTax,
      taxRate: numTaxRate,
      totalAmount: computedTotalAmount,
      refundAmount: 0,
      returnStatus: 'None',
      paymentStatus: 'Paid',
      orderType: 'POS',
      receiptNumber,
      paymentMethod: 'Easypaisa',
      cashTendered: computedTotalAmount,
      changeDue: 0,
      splitPayments: [],
      easypaisaDetails: {
        mobileNumber: easypaisaDetails?.mobileNumber || '',
        trxId: easypaisaDetails?.trxId || '',
      },
      cashierName: req.user.name || 'Counter Cashier',
      note: note || '',
    });

    const savedSale = await sale.save();

    // 6. Update customer spend statistics if linked
    if (finalCustomerId) {
      await Customer.findByIdAndUpdate(finalCustomerId, {
        $inc: {
          totalSpent: computedTotalAmount,
          totalOrders: 1,
        },
      }).catch(() => {});
    }

    // 7. Fetch Business Profile
    const business = await Business.findOne({ user: userId });

    // 8. Notification
    await Notification.create({
      user: userId,
      title: 'POS Sale Completed',
      message: `Receipt ${receiptNumber} generated for Rs. ${computedTotalAmount.toLocaleString()} (${paymentMethod}).`,
      type: 'sale',
      link: '/sales',
      isRead: false,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'POS Sale recorded successfully',
      sale: savedSale,
      receiptNumber,
      business: business || {
        businessName: req.user.businessName || 'Threadly Apparel & Retail',
        address: 'Retail Counter Store 1',
        phone: req.user.phone || '0300-1234567',
        currency: 'PKR',
      },
    });
  } catch (error) {
    console.error('[POS Controller] Checkout Error:', error);
    res.status(500).json({ message: error.message || 'Server error processing POS checkout' });
  }
};

// =========================================================================
// 2. VALIDATE CART BEFORE CHECKOUT (Stock, Prices, Discounts, Tax)
// =========================================================================
export const validatePOSCart = async (req, res) => {
  try {
    const { items = [], discountType = 'flat', discountValue = 0, taxRate = 0 } = req.body;
    const userId = req.user._id;

    const validatedItems = [];
    const warnings = [];
    let computedSubtotal = 0;

    for (const item of items) {
      let product = null;
      if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
        product = await Product.findOne({ _id: item.productId, user: userId });
      }
      if (!product && (item.sku || item.productId)) {
        product = await Product.findOne({ user: userId, productId: (item.sku || item.productId).toString().trim() });
      }
      if (!product && item.name) {
        product = await Product.findOne({ user: userId, name: item.name.trim() });
      }

      const requestedQty = Math.max(1, Number(item.qty) || 1);
      const unitPrice = product ? product.price : (Number(item.price) || 0);
      const availableStock = product ? product.stock : 999;

      let isStockSufficient = true;
      if (product && product.stock < requestedQty) {
        isStockSufficient = false;
        warnings.push({
          productId: product._id,
          name: product.name,
          message: `Only ${product.stock} units currently available.`,
        });
      }

      const lineTotal = unitPrice * requestedQty;
      computedSubtotal += lineTotal;

      validatedItems.push({
        ...item,
        price: unitPrice,
        availableStock,
        isStockSufficient,
        lineTotal,
      });
    }

    let computedDiscount = 0;
    const numDiscVal = Math.max(0, Number(discountValue) || 0);
    if (discountType === 'percentage') {
      computedDiscount = Math.round((computedSubtotal * Math.min(100, numDiscVal)) / 100);
    } else {
      computedDiscount = Math.min(computedSubtotal, Math.round(numDiscVal));
    }

    const numTax = Math.max(0, Number(taxRate) || 0);
    const taxable = Math.max(0, computedSubtotal - computedDiscount);
    const computedTax = Math.round((taxable * numTax) / 100);
    const computedGrandTotal = Math.max(0, taxable + computedTax);

    res.json({
      valid: warnings.length === 0,
      items: validatedItems,
      subtotal: computedSubtotal,
      discount: computedDiscount,
      tax: computedTax,
      grandTotal: computedGrandTotal,
      warnings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================================
// 3. GET PRODUCTS FOR POS CATALOG (With Brand, Variant, Search Filtering)
// =========================================================================
export const getPOSProducts = async (req, res) => {
  try {
    const { search, category, sku, size, color } = req.query;
    const query = { user: req.user._id };

    if (sku) {
      query.productId = sku.trim();
    } else if (search) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { productId: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { 'variants.values': { $regex: q, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }

    // Seed starter products if store is completely empty
    const totalUserProducts = await Product.countDocuments({ user: req.user._id });
    if (totalUserProducts === 0) {
      const starterProducts = [
        {
          user: req.user._id,
          productId: 'SKU-LAWN-001',
          name: 'Khaadi 3-Piece Printed Lawn Suit',
          category: 'Unstitched',
          price: 4850,
          costPrice: 3200,
          stock: 24,
          image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
          variants: [
            { name: 'Size', values: 'Unstitched' },
            { name: 'Color', values: 'Emerald Green, Royal Blue, Ruby Red' }
          ]
        },
        {
          user: req.user._id,
          productId: 'SKU-KRT-002',
          name: 'Gul Ahmed Embroidered Digital Kurti',
          category: 'Kurtis',
          price: 2950,
          costPrice: 1800,
          stock: 18,
          image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
          variants: [
            { name: 'Size', values: 'S, M, L, XL' },
            { name: 'Color', values: 'Peach, Mustard, Mint' }
          ]
        },
        {
          user: req.user._id,
          productId: 'SKU-MEN-003',
          name: 'J. Men Classic Egyptian Cotton Kurta',
          category: 'Men',
          price: 3850,
          costPrice: 2400,
          stock: 15,
          image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80',
          variants: [
            { name: 'Size', values: 'M, L, XL, XXL' },
            { name: 'Color', values: 'Off-White, Charcoal, Navy' }
          ]
        },
        {
          user: req.user._id,
          productId: 'SKU-PRET-004',
          name: 'Maria B Luxury Ready-to-Wear Pret',
          category: 'Pret',
          price: 7950,
          costPrice: 5100,
          stock: 9,
          image: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=600&auto=format&fit=crop&q=80',
          variants: [
            { name: 'Size', values: 'S, M, L' },
            { name: 'Color', values: 'Lilac, Teal' }
          ]
        },
        {
          user: req.user._id,
          productId: 'SKU-ST-005',
          name: 'Alkaram 2-Piece Stitched Jacquard Suit',
          category: 'Stitched',
          price: 4450,
          costPrice: 2900,
          stock: 12,
          image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80',
          variants: [
            { name: 'Size', values: 'S, M, L' },
            { name: 'Color', values: 'Dusty Pink, Ice Blue' }
          ]
        },
        {
          user: req.user._id,
          productId: 'SKU-ACC-006',
          name: 'Chiffon Embroidered Dupatta & Stole',
          category: 'Accessories',
          price: 1450,
          costPrice: 850,
          stock: 30,
          image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80',
          variants: [
            { name: 'Size', values: 'Free Size' },
            { name: 'Color', values: 'Black, Gold, Maroon' }
          ]
        },
        {
          user: req.user._id,
          productId: 'SKU-PRET-007',
          name: 'Sana Safinaz Silk Embroidered Tunic',
          category: 'Pret',
          price: 6250,
          costPrice: 4100,
          stock: 14,
          image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&auto=format&fit=crop&q=80',
          variants: [
            { name: 'Size', values: 'S, M, L' },
            { name: 'Color', values: 'Royal Emerald, Indigo' }
          ]
        },
        {
          user: req.user._id,
          productId: 'SKU-MEN-008',
          name: 'Bonanza Satrangi Men Festive Waistcoat',
          category: 'Men',
          price: 4500,
          costPrice: 2800,
          stock: 10,
          image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
          variants: [
            { name: 'Size', values: '38, 40, 42, 44' },
            { name: 'Color', values: 'Jet Black, Raw Silk Cream' }
          ]
        },
        {
          user: req.user._id,
          productId: 'SKU-KIDS-009',
          name: 'Edenrobe Boys Festive Kurta Set',
          category: 'Kids',
          price: 2850,
          costPrice: 1750,
          stock: 16,
          image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&auto=format&fit=crop&q=80',
          variants: [
            { name: 'Size', values: '4-6Y, 7-8Y, 9-10Y' },
            { name: 'Color', values: 'Sky Blue, Maroon' }
          ]
        }
      ];
      try {
        await Product.insertMany(starterProducts);
      } catch (e) {
        console.error('Auto-seed products error:', e);
      }
    }

    const products = await Product.find(query).sort({ stock: -1, updatedAt: -1 }).lean();

    const formatted = products.map((p) => {
      let sizes = ['Standard'];
      let colors = ['Default'];

      if (p.variants && Array.isArray(p.variants)) {
        p.variants.forEach((v) => {
          if (v.name && v.values) {
            const splitted = v.values.split(',').map((s) => s.trim()).filter(Boolean);
            if (v.name.toLowerCase().includes('size')) {
              sizes = splitted;
            } else if (v.name.toLowerCase().includes('color')) {
              colors = splitted;
            }
          }
        });
      }

      if (sizes.length === 1 && sizes[0] === 'Standard') {
        sizes = ['S', 'M', 'L', 'XL'];
      }

      return {
        _id: p._id,
        id: p._id,
        productId: p.productId,
        sku: p.productId,
        name: p.name,
        category: p.category,
        price: p.price,
        costPrice: p.costPrice || 0,
        stock: p.stock,
        image: (p.image && !p.image.includes('1595777457583')) ? p.image : '',
        sizes,
        colors,
        hasVariants: sizes.length > 1 || colors.length > 1,
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================================
// 4. HOLD & RESUME SALE
// =========================================================================
export const holdSale = async (req, res) => {
  try {
    const { items, customerId, customerName, customerPhone, subtotal, discountType, discountValue, taxRate, note } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cannot hold an empty cart.' });
    }

    const holdReference = `H-${Math.floor(1000 + Math.random() * 9000)}`;

    const held = await HeldSale.create({
      user: req.user._id,
      holdReference,
      customer: customerId && mongoose.Types.ObjectId.isValid(customerId) ? customerId : undefined,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      items,
      subtotal: Number(subtotal) || 0,
      discountType: discountType || 'flat',
      discountValue: Number(discountValue) || 0,
      taxRate: Number(taxRate) || 0,
      note: note || '',
    });

    res.status(201).json({ success: true, message: 'Sale held successfully', heldSale: held });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHeldSales = async (req, res) => {
  try {
    const heldSales = await HeldSale.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(heldSales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteHeldSale = async (req, res) => {
  try {
    const held = await HeldSale.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!held) {
      return res.status(404).json({ message: 'Held sale not found.' });
    }
    res.json({ success: true, message: 'Held sale cleared.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================================
// 5. SALES HISTORY LOOKUP (For Receipts, Counter Records & Returns)
// =========================================================================
export const getPOSSales = async (req, res) => {
  try {
    const { search, range } = req.query;
    const query = { user: req.user._id };

    if (search) {
      const q = search.trim();
      query.$or = [
        { receiptNumber: { $regex: q, $options: 'i' } },
        { customerName: { $regex: q, $options: 'i' } },
        { customerPhone: { $regex: q, $options: 'i' } },
      ];
    }

    if (range) {
      const now = new Date();
      if (range === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query.date = { $gte: start };
      } else if (range === 'yesterday') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query.date = { $gte: start, $lt: end };
      } else if (range === 'week') {
        const start = new Date(now.setDate(now.getDate() - 7));
        query.date = { $gte: start };
      } else if (range === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        query.date = { $gte: start };
      }
    }

    const sales = await Sale.find(query)
      .sort({ date: -1 })
      .limit(50)
      .lean();

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPOSReceipt = async (req, res) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!sale) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const business = await Business.findOne({ user: req.user._id });

    res.json({
      sale,
      business: business || {
        businessName: req.user.businessName || 'Threadly Apparel & Retail',
        address: 'Retail Counter Store 1',
        phone: req.user.phone || '0300-1234567',
        currency: 'PKR',
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================================
// 6. RETURNS & REFUNDS (Validated Quantities, Prorated Refunds & Audit Trail)
// =========================================================================
export const processPOSReturn = async (req, res) => {
  try {
    const { saleId, itemsToReturn = [], reason = 'Customer Return', paymentMethod = 'Easypaisa' } = req.body;
    const userId = req.user._id;

    if (!saleId || !itemsToReturn || itemsToReturn.length === 0) {
      return res.status(400).json({ message: 'Invalid return request. Sale ID and items required.' });
    }

    const sale = await Sale.findOne({ _id: saleId, user: userId });
    if (!sale) {
      return res.status(404).json({ message: 'Original sale transaction not found.' });
    }

    let plan;
    try { plan = planReturn(sale, itemsToReturn); }
    catch (error) { return res.status(400).json({ message: error.message }); }
    const totalRefundAmount = plan.refund;
    const returnItemsRecord = plan.lines.map(({ item, qty, refund }) => ({
      product: item.product, productId: item.productId, productName: item.productName,
      size: item.size, color: item.color, qty, unitPrice: refund / qty, refundSubtotal: refund,
    }));
    for (const { item, qty } of plan.lines) item.returnedQty = (item.returnedQty || 0) + qty;

    // Determine return status on sale
    const allItemsFullyReturned = sale.items.every(
      (it) => (it.returnedQty || 0) >= it.qty
    );
    sale.returnStatus = allItemsFullyReturned ? 'Full' : 'Partial';
    sale.refundAmount = Math.round(((sale.refundAmount || 0) + totalRefundAmount) * 100) / 100;
    if (sale.refundAmount >= sale.totalAmount) {
      sale.paymentStatus = 'Refunded';
    } else {
      sale.paymentStatus = 'Partially Refunded';
    }

    // Compare the prior version before committing any inventory restoration.
    const committed = await Sale.findOneAndUpdate(
      { _id: sale._id, user: userId, __v: sale.__v },
      { $set: { items: sale.items, returnStatus: sale.returnStatus, refundAmount: sale.refundAmount, paymentStatus: sale.paymentStatus }, $inc: { __v: 1 } },
      { returnDocument: 'after', runValidators: true },
    );
    if (!committed) return res.status(409).json({ message: 'This receipt changed. Refresh it before returning items.' });
    for (const { item, qty } of plan.lines) {
      if (item.product) await Product.findOneAndUpdate({ _id: item.product, user: userId }, { $inc: { stock: qty } });
    }


    // Adjust customer totalSpent if linked
    if (sale.customer) {
      await Customer.findByIdAndUpdate(sale.customer, {
        $inc: { totalSpent: -Math.min(sale.totalAmount, totalRefundAmount) },
      }).catch(() => {});
    }

    // Create persistent Return audit record
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const returnNumber = `RET-${datePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const returnDoc = await Return.create({
      user: userId,
      sale: sale._id,
      receiptNumber: sale.receiptNumber,
      returnNumber,
      customer: sale.customer,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      items: returnItemsRecord,
      refundAmount: totalRefundAmount,
      paymentMethod,
      reason,
      cashierName: req.user.name || 'Counter Cashier',
    });

    // Create Notification
    await Notification.create({
      user: userId,
      title: 'POS Return Processed',
      message: `Refund ${returnNumber} processed for Rs. ${totalRefundAmount.toLocaleString()} (${returnItemsRecord.length} items restocked).`,
      type: 'sale',
      link: '/sales',
      isRead: false,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Return processed and inventory restocked successfully',
      returnRecord: returnDoc,
      updatedSale: sale,
    });
  } catch (error) {
    console.error('POS Return Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// =========================================================================
// 7. AI NATURAL-LANGUAGE PRODUCT SEARCH (Real MongoDB Products Only)
// =========================================================================
export const posAISearch = async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user._id;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    let parsed = { keywords: [query.trim()], category: null, maxPrice: null, minPrice: null };

    try {
      const prompt = `You are a search parser for a Pakistani clothing boutique management system.
User query: "${query}"

Extract search filters into this EXACT JSON structure:
{
  "keywords": ["keyword1", "keyword2"],
  "category": "Kurtis" | "Unstitched" | "Stitched" | "Men" | "Pret" | "Accessories" | "Kids" | null,
  "maxPrice": number or null,
  "minPrice": number or null,
  "color": "Black" or null,
  "size": "L" or null
}
Return ONLY valid JSON.`;

      const aiResponse = await generateStructuredResponse(prompt, 'You parse apparel search queries into JSON. Return ONLY JSON.', 0.2);
      const cleanJson = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      // Fallback if AI parser is busy: extract words directly
      parsed = { keywords: query.split(/\s+/).filter(Boolean) };
    }

    // Build real MongoDB query
    const dbQuery = { user: userId };
    const andClauses = [];

    if (parsed.category) {
      andClauses.push({ category: { $regex: parsed.category, $options: 'i' } });
    }

    if (parsed.maxPrice && typeof parsed.maxPrice === 'number') {
      andClauses.push({ price: { $lte: parsed.maxPrice } });
    }

    if (parsed.minPrice && typeof parsed.minPrice === 'number') {
      andClauses.push({ price: { $gte: parsed.minPrice } });
    }

    if (parsed.color) {
      andClauses.push({
        $or: [
          { name: { $regex: parsed.color, $options: 'i' } },
          { 'variants.values': { $regex: parsed.color, $options: 'i' } }
        ]
      });
    }

    if (parsed.size) {
      andClauses.push({
        'variants.values': { $regex: parsed.size, $options: 'i' }
      });
    }

    const keywordList = Array.isArray(parsed.keywords) ? parsed.keywords : [query.trim()];
    if (keywordList.length > 0) {
      const keywordOr = keywordList.map((k) => ({
        $or: [
          { name: { $regex: k, $options: 'i' } },
          { productId: { $regex: k, $options: 'i' } },
          { category: { $regex: k, $options: 'i' } },
        ],
      }));
      andClauses.push(...keywordOr);
    }

    if (andClauses.length > 0) {
      dbQuery.$and = andClauses;
    }

    let products = await Product.find(dbQuery).limit(20).lean();

    // If strictly filtered query returned 0, fallback to broader query
    if (products.length === 0) {
      const fallbackRegex = query.trim().split(/\s+/).join('|');
      products = await Product.find({
        user: userId,
        $or: [
          { name: { $regex: fallbackRegex, $options: 'i' } },
          { category: { $regex: fallbackRegex, $options: 'i' } },
          { productId: { $regex: fallbackRegex, $options: 'i' } },
        ],
      }).limit(15).lean();
    }

    const formatted = products.map((p) => {
      let sizes = ['Standard'];
      let colors = ['Default'];
      if (p.variants && Array.isArray(p.variants)) {
        p.variants.forEach((v) => {
          if (v.name?.toLowerCase().includes('size') && v.values) {
            sizes = v.values.split(',').map((s) => s.trim()).filter(Boolean);
          } else if (v.name?.toLowerCase().includes('color') && v.values) {
            colors = v.values.split(',').map((c) => c.trim()).filter(Boolean);
          }
        });
      }
      return {
        _id: p._id,
        id: p._id,
        productId: p.productId,
        sku: p.productId,
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        image: p.image || '',
        sizes: sizes.length ? sizes : ['S', 'M', 'L', 'XL'],
        colors,
        hasVariants: sizes.length > 1 || colors.length > 1,
      };
    });

    res.json({
      success: true,
      query,
      interpretedFilters: parsed,
      count: formatted.length,
      products: formatted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================================
// 8. STRUCTURED AI POS ACTIONS (e.g., "Add 2 black shirts size L")
// =========================================================================
export const posAIAction = async (req, res) => {
  try {
    const { command } = req.body;
    const userId = req.user._id;

    if (!command || !command.trim()) {
      return res.status(400).json({ message: 'Command is required.' });
    }

    const prompt = `You are an intelligent POS cashier assistant in a retail clothing boutique.
The cashier or user says: "${command}"

Interpret the action into this EXACT JSON structure:
{
  "action": "add_to_cart" | "set_discount" | "find_customer" | "search_products" | "suggest_products" | "unknown",
  "productQuery": string or null,
  "maxPrice": number or null,
  "minPrice": number or null,
  "category": string or null,
  "quantity": number or 1,
  "size": string or null,
  "color": string or null,
  "discountType": "percentage" | "flat" or null,
  "discountValue": number or null,
  "customerQuery": string or null,
  "summary": "Short 1-sentence description of what to do"
}
Note: If the user asks for suggestions, recommendations, or items under/above a price (e.g., 'suggest me product under 5000', 'tell me product under 10000', 'what items under 3000'):
- Set "action": "suggest_products"
- Set "maxPrice" or "minPrice" as numbers
- Set "category" or "productQuery" if mentioned.
Return ONLY valid JSON.`;

    let actionParsed = { action: 'unknown' };
    try {
      const aiResponse = await generateStructuredResponse(prompt, 'You parse POS cashier commands into JSON. Return ONLY JSON.', 0.2);
      const cleanJson = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      actionParsed = JSON.parse(cleanJson);
    } catch {
      return res.status(400).json({ message: 'Could not understand cashier command. Please try again.' });
    }

    // Handle product recommendations / price ceiling queries
    if (
      actionParsed.action === 'suggest_products' ||
      actionParsed.action === 'search_products' ||
      actionParsed.maxPrice ||
      actionParsed.minPrice
    ) {
      const filter = { user: userId, stock: { $gt: 0 } };
      const andClauses = [];

      if (actionParsed.maxPrice && typeof actionParsed.maxPrice === 'number') {
        andClauses.push({ price: { $lte: actionParsed.maxPrice } });
      }
      if (actionParsed.minPrice && typeof actionParsed.minPrice === 'number') {
        andClauses.push({ price: { $gte: actionParsed.minPrice } });
      }
      if (actionParsed.category) {
        andClauses.push({ category: { $regex: actionParsed.category, $options: 'i' } });
      }
      if (actionParsed.productQuery) {
        andClauses.push({
          $or: [
            { name: { $regex: actionParsed.productQuery, $options: 'i' } },
            { category: { $regex: actionParsed.productQuery, $options: 'i' } },
            { productId: { $regex: actionParsed.productQuery, $options: 'i' } },
          ],
        });
      }

      if (andClauses.length > 0) {
        filter.$and = andClauses;
      }

      let matchedProducts = await Product.find(filter).sort({ price: 1 }).limit(10).lean();

      // If nothing found with strict filters, fallback to in-stock items
      if (matchedProducts.length === 0 && actionParsed.maxPrice) {
        matchedProducts = await Product.find({ user: userId, stock: { $gt: 0 } }).sort({ price: 1 }).limit(6).lean();
      }

      const formattedProducts = matchedProducts.map((p) => {
        let sizes = ['Standard'];
        let colors = ['Default'];
        if (p.variants && Array.isArray(p.variants)) {
          p.variants.forEach((v) => {
            if (v.name?.toLowerCase().includes('size') && v.values) {
              sizes = v.values.split(',').map((s) => s.trim()).filter(Boolean);
            } else if (v.name?.toLowerCase().includes('color') && v.values) {
              colors = v.values.split(',').map((c) => c.trim()).filter(Boolean);
            }
          });
        }
        return {
          _id: p._id,
          id: p._id,
          sku: p.productId,
          productId: p.productId,
          name: p.name,
          category: p.category,
          price: p.price,
          stock: p.stock,
          image: p.image || '',
          sizes: sizes.length ? sizes : ['S', 'M', 'L'],
          colors: colors.length ? colors : ['Default'],
        };
      });

      let responseMsg = '';
      if (formattedProducts.length > 0) {
        const priceLabel = actionParsed.maxPrice ? ` under PKR ${actionParsed.maxPrice.toLocaleString()}` : '';
        responseMsg = `Here are ${formattedProducts.length} in-stock product(s)${priceLabel} from your catalog:`;
      } else {
        responseMsg = `No in-stock garments currently found under the requested criteria.`;
      }

      return res.json({
        success: true,
        action: 'suggest_products',
        products: formattedProducts,
        count: formattedProducts.length,
        message: responseMsg,
      });
    }

    // Execute backend validation against REAL MongoDB data
    if (actionParsed.action === 'add_to_cart' && actionParsed.productQuery) {
      const cleanQuery = actionParsed.productQuery.trim();
      const product = await Product.findOne({
        user: userId,
        $or: [
          { name: { $regex: cleanQuery, $options: 'i' } },
          { productId: { $regex: cleanQuery, $options: 'i' } },
          { category: { $regex: cleanQuery, $options: 'i' } },
        ],
      });

      if (!product) {
        return res.json({
          success: false,
          action: 'add_to_cart',
          message: `Product "${actionParsed.productQuery}" not found in store catalog.`,
        });
      }

      const reqQty = Math.max(1, Number(actionParsed.quantity) || 1);
      if (product.stock < reqQty) {
        return res.json({
          success: false,
          action: 'add_to_cart',
          product,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${reqQty}.`,
        });
      }

      // Resolve valid variant
      let sizes = ['Standard'];
      let colors = ['Default'];
      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach((v) => {
          if (v.name?.toLowerCase().includes('size') && v.values) {
            sizes = v.values.split(',').map((s) => s.trim()).filter(Boolean);
          } else if (v.name?.toLowerCase().includes('color') && v.values) {
            colors = v.values.split(',').map((c) => c.trim()).filter(Boolean);
          }
        });
      }

      const chosenSize = actionParsed.size || sizes[0] || 'Standard';
      const chosenColor = actionParsed.color || colors[0] || 'Default';

      return res.json({
        success: true,
        action: 'add_to_cart',
        product: {
          _id: product._id,
          id: product._id,
          sku: product.productId,
          productId: product.productId,
          name: product.name,
          category: product.category,
          price: product.price,
          stock: product.stock,
          image: product.image || '',
        },
        size: chosenSize,
        color: chosenColor,
        qty: reqQty,
        message: `Validated: Add ${reqQty}x "${product.name}" (${chosenSize}, ${chosenColor}) at Rs. ${product.price.toLocaleString()} each.`,
      });
    }

    if (actionParsed.action === 'find_customer' && actionParsed.customerQuery) {
      const q = actionParsed.customerQuery.trim();
      const customer = await Customer.findOne({
        user: userId,
        $or: [{ name: { $regex: q, $options: 'i' } }, { phone: { $regex: q, $options: 'i' } }],
      });

      if (!customer) {
        return res.json({
          success: false,
          action: 'find_customer',
          message: `Customer "${q}" not found in database.`,
        });
      }

      return res.json({
        success: true,
        action: 'find_customer',
        customer,
        message: `Customer selected: ${customer.name} (${customer.phone || 'No phone'}).`,
      });
    }

    if (actionParsed.action === 'set_discount' && typeof actionParsed.discountValue === 'number') {
      return res.json({
        success: true,
        action: 'set_discount',
        discountType: actionParsed.discountType || 'percentage',
        discountValue: actionParsed.discountValue,
        message: `Discount set to ${actionParsed.discountValue}${actionParsed.discountType === 'percentage' ? '%' : ' PKR'}.`,
      });
    }

    res.json({
      success: true,
      action: actionParsed.action,
      data: actionParsed,
      message: actionParsed.summary || 'Command interpreted.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================================
// 9. AI UPSELLING / CROSS-SELLING & CUSTOMER-AWARE RECOMMENDATIONS
// =========================================================================
export const posAIRecommendations = async (req, res) => {
  try {
    const { cartItems = [], customerId } = req.body;
    const userId = req.user._id;

    // 1. Fetch real product catalog
    const allProducts = await Product.find({ user: userId, stock: { $gt: 0 } }).lean();
    if (allProducts.length === 0) {
      return res.json({ recommendations: [] });
    }

    // Exclude items already in cart
    const cartProductIds = new Set(cartItems.map((ci) => ci.productId || ci.sku));
    const candidateProducts = allProducts.filter(
      (p) => !cartProductIds.has(p._id.toString()) && !cartProductIds.has(p.productId)
    );

    if (candidateProducts.length === 0) {
      return res.json({ recommendations: [] });
    }

    // 2. Fetch customer purchase history if customer is selected
    let customerHistory = [];
    let customerDoc = null;
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      customerDoc = await Customer.findOne({ _id: customerId, user: userId }).lean();
      const pastSales = await Sale.find({ user: userId, customer: customerId })
        .sort({ date: -1 })
        .limit(5)
        .lean();
      customerHistory = pastSales.flatMap((s) => s.items.map((i) => i.productName));
    }

    // 3. Complementary Category Map
    const cartCategories = cartItems.map((c) => c.category).filter(Boolean);
    const candidateSummaries = candidateProducts.slice(0, 15).map((p) => ({
      id: p._id,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
    }));

    // 4. Generate AI Recommendation Pitch
    const prompt = `You are a fashion merchandiser assisting a boutique POS cashier.
Current Cart: ${JSON.stringify(cartItems.map((c) => ({ name: c.name, category: c.category, price: c.price })))}
Customer Profile: ${customerDoc ? `${customerDoc.name}, Past Purchases: ${customerHistory.join(', ') || 'None'}` : 'Walk-in'}
Available Catalog Candidates (REAL STOCK ONLY):
${JSON.stringify(candidateSummaries)}

Select top 3 BEST matching products from the candidates to cross-sell.
For each, provide:
- "productId": string (exact ID from candidates)
- "reason": short 1-sentence sales pitch for the cashier to say to the customer.

Return ONLY a valid JSON array of objects: [{"productId": "...", "reason": "..."}]`;

    let recommendations = [];
    try {
      const aiResponse = await generateStructuredResponse(prompt, 'Return ONLY valid JSON array. No markdown, no filler.', 0.3);
      const cleanJson = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedRecs = JSON.parse(cleanJson);

      recommendations = parsedRecs
        .map((rec) => {
          const matched = candidateProducts.find(
            (p) => p._id.toString() === rec.productId || p.productId === rec.productId
          );
          if (!matched) return null;
          return {
            _id: matched._id,
            id: matched._id,
            productId: matched.productId,
            sku: matched.productId,
            name: matched.name,
            category: matched.category,
            price: matched.price,
            stock: matched.stock,
            image: matched.image || '',
            reason: rec.reason,
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Default'],
          };
        })
        .filter(Boolean);
    } catch {
      // Fallback rule-based matching if Gemini is offline
      recommendations = candidateProducts.slice(0, 3).map((p) => ({
        _id: p._id,
        id: p._id,
        productId: p.productId,
        sku: p.productId,
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        image: p.image || '',
        reason: `Popular item in ${p.category} with ${p.stock} units in stock.`,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Default'],
      }));
    }

    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================================
// 10. AI CHECKOUT BUSINESS SUMMARY
// =========================================================================
export const posAICheckoutSummary = async (req, res) => {
  try {
    const { cartItems = [], subtotal = 0, totalAmount = 0, customerName = 'Walk-in' } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.json({ summary: 'Cart is empty.' });
    }

    const prompt = `Provide a concise 2-sentence executive summary of this retail sale for the cashier:
Customer: ${customerName}
Items (${cartItems.length}): ${cartItems.map((c) => `${c.qty}x ${c.name}`).join(', ')}
Total Value: PKR ${totalAmount.toLocaleString()}

Highlight fast-moving items or customer buying trend based strictly on the provided items. Keep it professional.`;

    try {
      const summary = await generateStructuredResponse(prompt, 'You are an executive retail assistant. Keep it concise.', 0.4);
      res.json({ success: true, summary: summary.trim() });
    } catch {
      res.json({
        success: true,
        summary: `${cartItems.length} items in cart totaling Rs. ${totalAmount.toLocaleString()} for ${customerName}.`,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================================
// 11. ML 7-DAY DEMAND FORECAST INSIGHT FOR POS ITEM
// =========================================================================
export const posMLDemandInsight = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const product = await Product.findOne({ _id: productId, user: userId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Call ML Microservice or compute moving average demand
    let predictedWeeklyUnits = 8;
    const mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

    try {
      const mlResponse = await fetch(`${mlUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId.toString(),
          horizon: 7,
          category: product.category || 'all',
          sensitivity: 'balanced',
          mongoUri: process.env.MONGO_URI,
        }),
      });

      if (mlResponse.ok) {
        const mlData = await mlResponse.json();
        if (Array.isArray(mlData.future_predictions) && mlData.future_predictions.length > 0) {
          predictedWeeklyUnits = Math.round(
            mlData.future_predictions.reduce((s, d) => s + (d.predicted_units || 0), 0)
          );
        }
      }
    } catch {
      // Fallback: estimate from past 30-day sales in MongoDB
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentSales = await Sale.find({
        user: userId,
        date: { $gte: thirtyDaysAgo },
        'items.product': product._id,
      }).lean();

      const soldUnits = recentSales.reduce((sum, s) => {
        const it = s.items.find((i) => i.product && i.product.toString() === product._id.toString());
        return sum + (it?.qty || 0);
      }, 0);

      predictedWeeklyUnits = Math.max(2, Math.round((soldUnits / 30) * 7));
    }

    const currentStock = product.stock;
    const isUnderstocked = currentStock < predictedWeeklyUnits;

    // AI explanation of the ML forecast
    let aiExplanation = '';
    try {
      const prompt = `Explain this inventory demand forecast for a clothing item:
Product: ${product.name}
Current In-Stock: ${currentStock} units
ML Predicted Demand Next 7 Days: ${predictedWeeklyUnits} units
Status: ${isUnderstocked ? 'Demand exceeds current stock' : 'Stock is adequate'}

Write a 1-sentence actionable insight for the cashier/manager.`;

      aiExplanation = await generateStructuredResponse(prompt, 'Write 1 concise retail inventory insight.', 0.3);
    } catch {
      aiExplanation = isUnderstocked
        ? `Only ${currentStock} units remain, while 7-day forecasted demand is ~${predictedWeeklyUnits} units. Consider restocking.`
        : `Stock level of ${currentStock} units is sufficient for projected 7-day demand (${predictedWeeklyUnits} units).`;
    }

    res.json({
      success: true,
      productId: product._id,
      name: product.name,
      currentStock,
      predictedWeeklyUnits,
      isUnderstocked,
      insight: aiExplanation.trim(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
