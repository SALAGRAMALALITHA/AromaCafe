const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    description: { type: String, default: '' },
    price:       { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    image:       { type: String, required: true },
    category:    { type: String, required: true },
    page:        { type: String, required: true },
    inStock:     { type: Boolean, default: true },
    active:      { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
