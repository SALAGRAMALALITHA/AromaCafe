const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  price: { type: Number, required: true },
  img:   { type: String },
  qty:   { type: Number, required: true, min: 1 }
});

const orderSchema = new mongoose.Schema(
  {
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    address: {
      label: String, line1: String, line2: String,
      city: String, state: String, pincode: String
    },
    status: { type: String, enum: ['placed', 'shipped', 'delivered', 'cancelled'], default: 'placed' }
  },
  { timestamps: true }   // gives us createdAt automatically — used as the order date
);

module.exports = mongoose.model('Order', orderSchema);
