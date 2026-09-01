const express = require('express');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth); // every route below requires a logged-in user

/* GET /api/users/me — current user's profile + addresses */
router.get('/me', async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json(user.toSafeObject());
});

/* PUT /api/users/me — update name/phone/email
   body: { name, phone, email } */
router.put('/me', async (req, res) => {
  const { name, phone, email } = req.body;
  const updates = { name, phone };

  if (email) {
    const normalizedEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing && String(existing._id) !== req.userId) {
      return res.status(409).json({ error: 'That email is already in use by another account.' });
    }

    updates.email = normalizedEmail;
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: updates },
    { new: true }
  );
  res.json(user.toSafeObject());
});

/* POST /api/users/me/addresses — add a new address
   body: { label, line1, line2, city, state, pincode, isDefault } */
router.post('/me/addresses', async (req, res) => {
  const user = await User.findById(req.userId);
  const address = req.body;

  if (address.isDefault || user.addresses.length === 0) {
    user.addresses.forEach(a => (a.isDefault = false));
    address.isDefault = true;
  }
  user.addresses.push(address);
  await user.save();
  res.status(201).json(user.toSafeObject());
});

/* PUT /api/users/me/addresses/:addressId — edit an address */
router.put('/me/addresses/:addressId', async (req, res) => {
  const user = await User.findById(req.userId);
  const addr = user.addresses.id(req.params.addressId);
  if (!addr) return res.status(404).json({ error: 'Address not found.' });

  Object.assign(addr, req.body);
  if (req.body.isDefault) {
    user.addresses.forEach(a => {
      if (String(a._id) !== req.params.addressId) a.isDefault = false;
    });
  }
  await user.save();
  res.json(user.toSafeObject());
});

/* DELETE /api/users/me/addresses/:addressId */
router.delete('/me/addresses/:addressId', async (req, res) => {
  const user = await User.findById(req.userId);
  user.addresses.id(req.params.addressId)?.deleteOne();

  if (user.addresses.length && !user.addresses.some(a => a.isDefault)) {
    user.addresses[0].isDefault = true;
  }
  await user.save();
  res.json(user.toSafeObject());
});

/* GET /api/users/me/cart — current user's cart */
router.get('/me/cart', async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json(user.cart || []);
});

/* PUT /api/users/me/cart — replace the entire cart
   body: [{ name, price, image, qty }] */
router.put('/me/cart', async (req, res) => {
  const { cart } = req.body;
  if (!Array.isArray(cart)) {
    return res.status(400).json({ error: 'Cart must be an array.' });
  }

  const cleaned = cart
    .filter(item => item.name && Number(item.price) >= 0 && Number(item.qty) > 0)
    .map(item => ({
      name:  String(item.name),
      price: Number(item.price),
      image: String(item.image || ''),
      qty:   Number(item.qty)
    }));

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: { cart: cleaned } },
    { new: true }
  );
  res.json(user.cart);
});

/* DELETE /api/users/me/cart — clear the cart */
router.delete('/me/cart', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: { cart: [] } },
    { new: true }
  );
  res.json(user.cart);
});

module.exports = router;
