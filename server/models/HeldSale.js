import mongoose from 'mongoose';

const heldSaleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    holdReference: {
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
        cartId: { type: String },
        productId: { type: String, required: true },
        sku: { type: String, default: '' },
        name: { type: String, required: true },
        category: { type: String, default: '' },
        price: { type: Number, required: true },
        qty: { type: Number, required: true, default: 1 },
        size: { type: String, default: '' },
        color: { type: String, default: '' },
        maxStock: { type: Number, default: 0 },
        image: { type: String, default: '' },
      },
    ],
    subtotal: {
      type: Number,
      default: 0,
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
    taxRate: {
      type: Number,
      default: 0,
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

const HeldSale = mongoose.model('HeldSale', heldSaleSchema);
export default HeldSale;
