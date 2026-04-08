const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    awbNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    merchantId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    courierPartner: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true,
      enum: ['shiprocket', 'delhivery', 'bluedart', 'dtdc', 'ekart', 'kwikship'],
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ['DELIVERED', 'RTO', 'IN_TRANSIT', 'LOST'],
      index: true,
    },
    codAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    declaredWeight: {
      type: Number,
      required: true,
      min: 0,
    },
    orderDate: {
      type: Date,
      required: true,
    },
    deliveryDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
