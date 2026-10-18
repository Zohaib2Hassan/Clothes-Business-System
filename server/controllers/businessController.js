import Business from '../models/Business.js';

// @desc    Get business profile
// @route   GET /api/business
// @access  Private
export const getBusiness = async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user._id });
    if (business) {
      res.json(business);
    } else {
      res.json({
        businessName: '',
        businessType: 'Retail Clothing',
        city: '',
        currency: 'PKR',
        address: '',
        phone: '',
        taxNumber: ''
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create business profile
// @route   POST /api/business
// @access  Private
export const createBusiness = async (req, res) => {
  try {
    const { businessName, businessType, city, currency, address, phone, taxNumber } = req.body;

    let business = await Business.findOne({ user: req.user._id });
    if (business) {
      business.businessName = businessName || business.businessName;
      business.businessType = businessType || business.businessType;
      business.city = city || business.city;
      business.currency = currency || business.currency;
      business.address = address !== undefined ? address : business.address;
      business.phone = phone !== undefined ? phone : business.phone;
      business.taxNumber = taxNumber !== undefined ? taxNumber : business.taxNumber;
      await business.save();
      return res.json(business);
    }

    business = await Business.create({
      user: req.user._id,
      businessName: businessName || 'My Business',
      businessType: businessType || 'Retail Clothing',
      city: city || 'Karachi',
      currency: currency || 'PKR',
      address: address || '',
      phone: phone || '',
      taxNumber: taxNumber || '',
    });

    res.status(201).json(business);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update business profile
// @route   PUT /api/business
// @access  Private
export const updateBusiness = async (req, res) => {
  try {
    let business = await Business.findOne({ user: req.user._id });

    if (business) {
      if (req.body.businessName !== undefined) business.businessName = req.body.businessName;
      if (req.body.businessType !== undefined) business.businessType = req.body.businessType;
      if (req.body.city !== undefined) business.city = req.body.city;
      if (req.body.currency !== undefined) business.currency = req.body.currency;
      if (req.body.address !== undefined) business.address = req.body.address;
      if (req.body.phone !== undefined) business.phone = req.body.phone;
      if (req.body.taxNumber !== undefined) business.taxNumber = req.body.taxNumber;

      const updatedBusiness = await business.save();
      return res.json(updatedBusiness);
    } else {
      business = await Business.create({
        user: req.user._id,
        businessName: req.body.businessName || 'My Business',
        businessType: req.body.businessType || 'Retail Clothing',
        city: req.body.city || 'Karachi',
        currency: req.body.currency || 'PKR',
        address: req.body.address || '',
        phone: req.body.phone || '',
        taxNumber: req.body.taxNumber || '',
      });
      return res.json(business);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
