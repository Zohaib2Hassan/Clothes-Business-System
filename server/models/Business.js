import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    businessName: {
      type: String,
      required: true,
    },
    businessType: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      default: 'PKR',
    },
    address: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    taxNumber: {
      type: String,
      default: '',
    }
  },
  {
    timestamps: true,
  }
);

const Business = mongoose.model('Business', businessSchema);
export default Business;
