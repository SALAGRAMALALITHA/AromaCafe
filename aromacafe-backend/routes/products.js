const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

/* GET /api/products — all active products, optionally filtered by category or search term */
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { active: true };

    if (category) filter.category = new RegExp(`^${category}$`, 'i');
    if (search) {
      const term = new RegExp(search, 'i');
      filter.$or = [{ name: term }, { category: term }, { description: term }];
    }

    const products = await Product.find(filter).sort({ category: 1, name: 1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load products.' });
  }
});

/* GET /api/products/:id — single product */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load product.' });
  }
});

module.exports = router;
