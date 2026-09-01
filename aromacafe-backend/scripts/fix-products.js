const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, '../seed/extracted-products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

const fixes = [
  // Coffee Beans
  {
    image: 'https://d3kgrlupo77sg7.cloudfront.net/media/chococoorgspice.com/images/products/coorg-arabica-roasted-coffee-beans.20231001174407.webp',
    name: 'Arabica Coffee Beans',
    price: 185,
    originalPrice: null
  },
  {
    image: 'https://delzing.com/wp-content/uploads/2022/10/Pure-Filter-coffee-powder.jpeg',
    name: 'Filter Coffee Powder',
    price: 200,
    originalPrice: null
  },
  {
    image: 'https://coffeeaffection.com/wp-content/uploads/2023/03/liberica-coffee-beans_eanjoseph_Shutterstock.jpg',
    name: 'Liberica Coffee Beans',
    price: 250,
    originalPrice: null
  },
  // Accessories
  {
    image: 'https://assets.ajio.com/medias/sys_master/root/20230607/wvtJ/6480784dd55b7d0c6355977a/-1117Wx1400H-463584222-cream-MODEL.jpg',
    name: 'Coffee Pack of 6',
    price: 199,
    originalPrice: null
  },
  {
    image: 'https://lzd-img-global.slatic.net/g/p/8661739db3590561ec11e46ec783d332.jpg_720x720q80.jpg_.webp',
    name: 'Coffee Pack of 3',
    price: 199,
    originalPrice: null
  },
  {
    image: 'https://rukminim2.flixcart.com/image/850/1000/l4ssfww0/mug/f/b/d/vacuum-insulated-steel-tea-coffee-mug-thermos-flask-travel-mug-original-imagfmdh6vpzggng.jpeg',
    name: 'Thermo Coffee Tumbler',
    price: 199,
    originalPrice: null
  },
  {
    image: 'https://i.pinimg.com/736x/51/31/31/513131b04e5e99d5cc3fda36ada130eb.jpg',
    name: 'Coffee Glass',
    price: 199,
    originalPrice: null
  },
  {
    image: 'https://img.ws.mms.shopee.com.my/be57d3f36473d8a69bdaaadc36d882ef',
    name: 'Coffee Filter',
    price: 199,
    originalPrice: null
  },
  // Gifts
  {
    image: 'https://www.lovedandfoundbox.com/cdn/shop/products/wood-coffee-snack-client-gift-box-for-two_1972x.jpg?v=1677770476',
    name: 'Gift Hamper - Coffee Lover',
    price: 499,
    originalPrice: null
  },
  {
    image: 'https://i0.wp.com/doinggoodco.com/wp-content/uploads/2023/10/Coffee-Lover-All-Product-with-Large-Match-Bottle-Square-for-Web.png?fit=635%2C635&ssl=1',
    name: 'Gift Card Rs.500',
    price: 500,
    originalPrice: null
  },
  {
    image: 'https://artisante.in/cdn/shop/products/large-gift-box-everything-chocolate-meets-coffee-903209_1400x.jpg?v=1694860069',
    name: 'Premium Coffee Box',
    price: 699,
    originalPrice: null
  }
];

let changed = 0;
for (const fix of fixes) {
  const p = products.find(p => p.image === fix.image);
  if (p) {
    // The current 'name' is actually the description; move it to description
    p.description = p.name;
    p.name = fix.name;
    p.price = fix.price;
    p.originalPrice = fix.originalPrice;
    changed++;
  }
}

fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
console.log(`Fixed ${changed} products in extracted-products.json`);
