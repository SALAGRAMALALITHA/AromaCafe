const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  qty:   { type: Number, required: true, min: 1 }
});

const addressSchema = new mongoose.Schema({
  label:     { type: String, required: true },   // e.g. "Home", "Work"
  line1:     { type: String, required: true },
  line2:     { type: String },
  city:      { type: String, required: true },
  state:     { type: String, required: true },
  pincode:   { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true },   // stored as a bcrypt hash, never plain text
    phone:     { type: String, required: true },
    role:      { type: String, enum: ['customer', 'admin'], default: 'customer' },
    addresses: [addressSchema],
    cart:      [cartItemSchema]
  },
  { timestamps: true }
);

// Never send the password hash back in API responses
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
