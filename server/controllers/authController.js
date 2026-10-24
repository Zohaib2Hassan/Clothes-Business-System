import User from '../models/User.js';
import Business from '../models/Business.js';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import Customer from '../models/Customer.js';
import Expense from '../models/Expense.js';
import HeldSale from '../models/HeldSale.js';
import Return from '../models/Return.js';
import Notification from '../models/Notification.js';
import jwt from 'jsonwebtoken';
import { send2FACode, isEmailConfigured } from '../services/emailService.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  let { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    name = name.trim();
    email = email.trim().toLowerCase();

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
  let { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.twoFactorCode = code;
        user.twoFactorCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        // Dispatch real email if SMTP is configured in .env
        const emailResult = await send2FACode(user.email, code, user.name);

        if (!emailResult.sent && process.env.NODE_ENV === 'production') {
          return res.status(503).json({ message: 'Verification email could not be delivered. Configure the website email service, then sign in again.' });
        }
        const tempToken = jwt.sign(
          { id: user._id, purpose: '2fa_login' },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '10m' }
        );

        return res.json({
          requires2FA: true,
          email: user.email,
          tempToken,
          ...(process.env.NODE_ENV !== 'production' ? { devCode: code } : {}),
          emailSent: emailResult.sent,
          isEmailConfigured: isEmailConfigured(),
          message: emailResult.sent
            ? `A 6-digit verification code has been sent to your email (${user.email}).`
            : `Two-factor verification required. Email service is running in local/demo mode (code displayed on screen).`,
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar || '',
        twoFactorEnabled: user.twoFactorEnabled || false,
        notificationPreferences: user.notificationPreferences,
        appearance: user.appearance,
        language: user.language || 'English',
        subscriptionTier: user.subscriptionTier,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password. Please verify your credentials.' });
    }
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

// @desc    Verify 2FA Code
// @route   POST /api/auth/verify-2fa
// @access  Public
export const verify2FA = async (req, res) => {
  const { code, tempToken } = req.body;

  try {
    if (!code) {
      return res.status(400).json({ message: 'Please enter the 6-digit verification code' });
    }

    if (!tempToken) {
      return res.status(401).json({ message: 'Please sign in with your email and password first.' });
    }
    let user;
    try {
      const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secret');
      if (decoded.purpose !== '2fa_login') throw new Error('Invalid login session');
      user = await User.findById(decoded.id);
    } catch {
      return res.status(401).json({ message: '2FA session expired. Please log in again.' });
    }
    if (!user?.twoFactorEnabled) {
      return res.status(401).json({ message: 'Please log in again.' });
    }

    const trimmedCode = code.toString().trim();
    const isCodeValid =
      user.twoFactorCode && user.twoFactorCode === trimmedCode && user.twoFactorCodeExpires > new Date();

    if (!isCodeValid) {
      return res.status(400).json({ message: 'Invalid or expired 2FA code. Please try again.' });
    }

    // Clear one-time code
    user.twoFactorCode = '';
    user.twoFactorCodeExpires = null;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      avatar: user.avatar || '',
      twoFactorEnabled: user.twoFactorEnabled || false,
      notificationPreferences: user.notificationPreferences,
      appearance: user.appearance,
      language: user.language || 'English',
      subscriptionTier: user.subscriptionTier,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend 2FA Code
// @route   POST /api/auth/resend-2fa
// @access  Public
export const resend2FACode = async (req, res) => {
  const { tempToken } = req.body;

  try {
    if (!tempToken) {
      return res.status(401).json({ message: 'Please sign in with your email and password first.' });
    }
    let user;
    try {
      const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secret');
      if (decoded.purpose !== '2fa_login') throw new Error('Invalid login session');
      user = await User.findById(decoded.id);
    } catch {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    if (!user?.twoFactorEnabled) {
      return res.status(401).json({ message: 'Please log in again.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFactorCode = code;
    user.twoFactorCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const emailResult = await send2FACode(user.email, code, user.name);

    if (!emailResult.sent && process.env.NODE_ENV === 'production') {
      return res.status(503).json({ message: 'Verification email could not be delivered. Configure the website email service, then sign in again.' });
    }
    res.json({
      success: true,
      ...(process.env.NODE_ENV !== 'production' ? { devCode: code } : {}),
      emailSent: emailResult.sent,
      isEmailConfigured: isEmailConfigured(),
      message: emailResult.sent
        ? `A new 6-digit verification code has been sent to ${user.email}.`
        : `A new verification code has been generated. (Email service in local/demo mode: code shown on screen).`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Update user profile & settings
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already in use by another account' });
      }
      user.email = req.body.email;
    }
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
    if (req.body.twoFactorEnabled === true && process.env.NODE_ENV === 'production' && !isEmailConfigured()) {
      return res.status(400).json({ message: 'Configure the website email service before enabling two-factor sign-in.' });
    }
    if (req.body.twoFactorEnabled !== undefined) {
      user.twoFactorEnabled = req.body.twoFactorEnabled;
      if (!req.body.twoFactorEnabled) {
        user.twoFactorCode = '';
        user.twoFactorCodeExpires = null;
      }
    }
    if (req.body.notificationPreferences !== undefined) {
      user.notificationPreferences = {
        ...(user.notificationPreferences?.toObject ? user.notificationPreferences.toObject() : user.notificationPreferences),
        ...req.body.notificationPreferences,
      };
    }
    if (req.body.appearance !== undefined) {
      user.appearance = {
        ...(user.appearance?.toObject ? user.appearance.toObject() : user.appearance),
        ...req.body.appearance,
      };
    }
    if (req.body.language !== undefined) user.language = req.body.language;

    // Handle password change
    if (req.body.newPassword) {
      if (!req.body.currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }
      const isMatch = await user.matchPassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password does not match' });
      }
      if (req.body.newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }
      user.password = req.body.newPassword;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      avatar: updatedUser.avatar || '',
      twoFactorEnabled: updatedUser.twoFactorEnabled || false,
      notificationPreferences: updatedUser.notificationPreferences,
      appearance: updatedUser.appearance,
      language: updatedUser.language || 'English',
      subscriptionTier: updatedUser.subscriptionTier,
      token: generateToken(updatedUser._id),
      message: req.body.newPassword ? 'Password updated successfully' : 'Profile updated successfully',
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete user account and all data
// @route   DELETE /api/auth/profile
// @access  Private
export const deleteUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Promise.all([
      User.findByIdAndDelete(req.user._id),
      Business.deleteMany({ user: req.user._id }),
      Product.deleteMany({ user: req.user._id }),
      Sale.deleteMany({ user: req.user._id }),
      Customer.deleteMany({ user: req.user._id }),
      Expense.deleteMany({ user: req.user._id }),
      HeldSale.deleteMany({ user: req.user._id }),
      Return.deleteMany({ user: req.user._id }),
      Notification.deleteMany({ user: req.user._id }),
    ]);

    res.json({ message: 'Account and all data successfully deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
