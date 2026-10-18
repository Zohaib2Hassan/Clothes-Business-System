import Customer from '../models/Customer.js';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { user: req.user._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, user: req.user._id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(404).json({ message: 'Customer not found' });
  }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private
export const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Customer name is required' });
    }
    
    const customer = new Customer({
      user: req.user._id,
      name: name.trim(),
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      totalSpent: 0,
      totalOrders: 0
    });
    
    const createdCustomer = await customer.save();
    res.status(201).json(createdCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    const customer = await Customer.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (name !== undefined) customer.name = name.trim();
    if (email !== undefined) customer.email = email.trim();
    if (phone !== undefined) customer.phone = phone.trim();
    if (address !== undefined) customer.address = address.trim();
    
    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, user: req.user._id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await Customer.deleteOne({ _id: req.params.id });
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
