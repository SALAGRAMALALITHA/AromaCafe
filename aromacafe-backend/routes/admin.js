const express = require('express');
const Order = require('../models/Order');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

const router = express.Router();

// All routes below require a logged-in admin user
router.use(requireAuth, requireAdmin);

/* GET /api/admin/orders — all orders, newest first, with user details */
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load orders.' });
  }
});

/* PUT /api/admin/orders/:orderId/status
   body: { status } where status is one of placed, shipped, delivered, cancelled */
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['placed', 'shipped', 'delivered', 'cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status.' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { $set: { status } },
      { new: true }
    ).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update order status.' });
  }
});

module.exports = router;
