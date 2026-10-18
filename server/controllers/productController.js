import Product from '../models/Product.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user._id });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product && product.user.toString() === req.user._id.toString()) {
      res.json(product);
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    res.status(404).json({ message: 'Product not found' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private
export const createProduct = async (req, res) => {
  try {
    const { productId, name, category, price, costPrice, stock, image, variants } = req.body;
    
    const finalProductId = (productId && typeof productId === 'string' && productId.trim())
      ? productId.trim()
      : `PRD-${Math.floor(1000 + Math.random() * 9000)}`;

    const existingProduct = await Product.findOne({ user: req.user._id, productId: finalProductId });
    if (existingProduct) {
      return res.status(400).json({ message: `Product ID "${finalProductId}" already exists. Please choose a unique ID.` });
    }

    const product = new Product({
      user: req.user._id,
      productId: finalProductId,
      name,
      category,
      price,
      costPrice,
      stock,
      image,
      variants
    });
    
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Product ID already exists. Please choose a unique ID.' });
    }
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = async (req, res) => {
  try {
    const { productId, name, category, price, costPrice, stock, image, variants } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (product && product.user.toString() === req.user._id.toString()) {
      if (productId && typeof productId === 'string' && productId.trim() && productId.trim() !== product.productId) {
        const existing = await Product.findOne({
          user: req.user._id,
          productId: productId.trim(),
          _id: { $ne: product._id }
        });
        if (existing) {
          return res.status(400).json({ message: `Product ID "${productId.trim()}" is already in use by another product.` });
        }
        product.productId = productId.trim();
      }

      product.name = name || product.name;
      product.category = category || product.category;
      product.price = price !== undefined ? price : product.price;
      product.costPrice = costPrice !== undefined ? costPrice : product.costPrice;
      product.stock = stock !== undefined ? stock : product.stock;
      product.image = image || product.image;
      product.variants = variants || product.variants;
      
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Product ID already exists. Please choose a unique ID.' });
    }
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (product && product.user.toString() === req.user._id.toString()) {
      await Product.deleteOne({ _id: product._id });
      res.json({ message: 'Product removed' });
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
