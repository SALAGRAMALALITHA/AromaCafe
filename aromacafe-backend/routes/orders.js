const express = require('express');
const Order = require('../models/Order');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

/* GET /api/orders — logged-in user's order history, newest first */
router.get('/', async (req, res) => {
  const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(orders);
});

/* POST /api/orders — place a new order
   body: { items: [{name, price, img, qty}], total, address } */
router.post('/', async (req, res) => {
  const { items, total, address } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Cannot place an empty order.' });
  }
  if (!address) {
    return res.status(400).json({ error: 'A delivery address is required.' });
  }

  const order = await Order.create({ user: req.userId, items, total, address });
  res.status(201).json(order);
});

module.exports = router;
