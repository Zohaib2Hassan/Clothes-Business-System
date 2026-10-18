import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Sale',
    },
    receiptNumber: {
      type: String,
      required: true,
    },
    returnNumber: {
      type: String,
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      default: 'Walk-in Customer',
    },
    customerPhone: {
      type: String,
      default: '',
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        productId: {
          type: String,
          default: '',
        },
        productName: {
          type: String,
          required: true,
        },
        size: {
          type: String,
          default: '',
        },
        color: {
          type: String,
          default: '',
        },
        qty: {
          type: Number,
          required: true,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        refundSubtotal: {
          type: Number,
          required: true,
        },
      },
    ],
    refundAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      default: 'Easypaisa',
    },
    reason: {
      type: String,
      default: 'Customer return',
    },
    cashierName: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Return = mongoose.model('Return', returnSchema);
export default Return;
