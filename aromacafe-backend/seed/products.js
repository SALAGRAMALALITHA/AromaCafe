require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted-products.json'), 'utf-8'));

async function seed() {
  const connectDB = require('../config/db');
  await connectDB();

  await Product.deleteMany({});
  await Product.insertMany(products);

  console.log(`✅ Seeded ${products.length} products`);
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
