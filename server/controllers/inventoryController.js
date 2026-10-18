import Product from '../models/Product.js';

// @desc    Get inventory items with stock status
// @route   GET /api/inventory
// @access  Private
export const getInventory = async (req, res) => {
  try {
    const { search, filter } = req.query;

    const query = { user: req.user._id };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const products = await Product.find(query).sort({ updatedAt: -1 });

    const items = products.map((product) => {
      let status = 'In Stock';
      if (product.stock === 0) {
        status = 'Out of Stock';
      } else if (product.stock <= 10) {
        status = 'Low Stock';
      }

      return {
        _id: product._id,
        id: product._id,
        productId: product.productId,
        name: product.name,
        category: product.category,
        price: product.price,
        costPrice: product.costPrice,
        stock: product.stock,
        status,
        image: (product.image && !product.image.includes('1595777457583')) ? product.image : '',
        sizes: product.sizes || [],
        variants: product.variants,
        updatedAt: product.updatedAt
      };
    });

    // Optional server-side filtering if requested via query
    let filteredItems = items;
    if (filter === 'low-stock') {
      filteredItems = items.filter((item) => item.status === 'Low Stock');
    } else if (filter === 'out-of-stock') {
      filteredItems = items.filter((item) => item.status === 'Out of Stock');
    } else if (filter === 'in-stock') {
      filteredItems = items.filter((item) => item.status === 'In Stock');
    }

    const lowStockCount = items.filter((item) => item.status === 'Low Stock').length;
    const outOfStockCount = items.filter((item) => item.status === 'Out of Stock').length;
    const inStockCount = items.filter((item) => item.status === 'In Stock').length;

    res.json({
      items: filteredItems,
      total: items.length,
      stats: {
        totalProducts: items.length,
        inStockCount,
        lowStockCount,
        outOfStockCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get low stock items only
// @route   GET /api/inventory/low-stock
// @access  Private
export const getLowStock = async (req, res) => {
  try {
    const products = await Product.find({
      user: req.user._id,
      stock: { $lte: 10 }
    }).sort({ stock: 1 });

    const items = products.map((product) => ({
      _id: product._id,
      id: product._id,
      name: product.name,
      stock: product.stock,
      status: product.stock === 0 ? 'Out of Stock' : 'Low Stock',
      image: product.image,
      price: product.price
    }));

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update stock manually for a product
// @route   PUT /api/inventory/update-stock
// @access  Private
export const updateStock = async (req, res) => {
  try {
    const { productId, stock } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const newStock = Number(stock);
    if (isNaN(newStock) || newStock < 0) {
      return res.status(400).json({ message: 'Stock must be a valid non-negative number' });
    }

    const product = await Product.findOne({
      _id: productId,
      user: req.user._id
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.stock = newStock;
    const updatedProduct = await product.save();

    let status = 'In Stock';
    if (updatedProduct.stock === 0) {
      status = 'Out of Stock';
    } else if (updatedProduct.stock <= 10) {
      status = 'Low Stock';
    }

    res.json({
      message: 'Stock updated successfully',
      product: {
        _id: updatedProduct._id,
        name: updatedProduct.name,
        stock: updatedProduct.stock,
        status,
        updatedAt: updatedProduct.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
