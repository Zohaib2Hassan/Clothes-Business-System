import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        productName: {
          type: String,
          default: '',
        },
        productId: {
          type: String,
          default: '',
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
        price: {
          type: Number,
          required: true,
        },
        subtotal: {
          type: Number,
          default: 0,
        },
        returnedQty: {
          type: Number,
          default: 0,
        },
      }
    ],
    subtotal: {
      type: Number,
      required: true,
      default: 0.0,
    },
    discount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    discountType: {
      type: String,
      enum: ['flat', 'percentage'],
      default: 'flat',
    },
    discountValue: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0.0,
    },
    taxRate: {
      type: Number,
      default: 0.0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    refundAmount: {
      type: Number,
      default: 0.0,
    },
    returnStatus: {
      type: String,
      enum: ['None', 'Partial', 'Full'],
      default: 'None',
    },
    paymentStatus: {
      type: String,
      required: true,
      default: 'Paid',
    },
    orderType: {
      type: String,
      default: 'POS',
    },
    receiptNumber: {
      type: String,
    },
    paymentMethod: {
      type: String,
      default: 'Easypaisa',
    },
    cashTendered: {
      type: Number,
      default: 0,
    },
    changeDue: {
      type: Number,
      default: 0,
    },
    splitPayments: [
      {
        method: { type: String },
        amount: { type: Number },
      }
    ],
    easypaisaDetails: {
      mobileNumber: { type: String, default: '' },
      trxId: { type: String, default: '' },
    },
    cardDetails: {
      cardType: { type: String, default: '' },
      cardBank: { type: String, default: '' },
      cardLast4: { type: String, default: '' },
      cardRefNumber: { type: String, default: '' },
    },
    bankTransferDetails: {
      bankName: { type: String, default: '' },
      refNumber: { type: String, default: '' },
    },
    cashierName: {
      type: String,
      default: '',
    },
    note: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;
