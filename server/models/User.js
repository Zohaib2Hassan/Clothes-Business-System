import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    subscriptionTier: {
      type: String,
      enum: ['Free', 'Pro', 'Premium', 'Annual', 'Enterprise'],
      default: 'Free',
    },
    subscriptionExpiresAt: {
      type: Date,
    },
    aiCredits: {
      type: Number,
      default: 50,
    },
    billingHistory: [
      {
        planName: { type: String, required: true },
        amount: { type: Number, required: true },
        paymentMethod: { type: String, default: 'Easypaisa' },
        date: { type: Date, default: Date.now },
        status: { type: String, default: 'Paid' },
        invoiceId: { type: String, required: true },
      }
    ],
    phone: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorCode: {
      type: String,
      default: '',
    },
    twoFactorCodeExpires: {
      type: Date,
    },
    notificationPreferences: {
      emailAlerts: { type: Boolean, default: true },
      stockAlerts: { type: Boolean, default: true },
      salesAlerts: { type: Boolean, default: true },
      marketingTips: { type: Boolean, default: false },
    },
    appearance: {
      theme: { type: String, default: 'light' },
      compactMode: { type: Boolean, default: false },
    },
    language: {
      type: String,
      default: 'English',
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
export default User;
