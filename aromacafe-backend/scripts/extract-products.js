const fs = require('fs');
const path = require('path');

const coffeeDir = path.resolve(__dirname, '../../coffee');

const categoryMap = {
  'hot.html': 'Hot Drinks',
  'cold.html': 'Cold Drinks',
  'fresh.html': 'Refreshments',
  'combo.html': 'Combos',
  'choco.html': 'Chocolates',
  'dessert.html': 'Desserts',
  'beans.html': 'Coffee Beans',
  'accessories.html': 'Accessories',
  'gifts.html': 'Gifts'
};

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function cleanText(text) {
  return decodeHtmlEntities(text)
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function extractProducts(file, category) {
  const html = fs.readFileSync(file, 'utf-8');
  const products = [];

  // Split by product boxes
  const boxes = html.split('<div class="box">').slice(1);

  function findMatchingBoxEnd(html) {
    let depth = 1;
    let i = 0;
    while (i < html.length && depth > 0) {
      const openTag = html.indexOf('<div', i);
      const closeTag = html.indexOf('</div>', i);
      if (closeTag === -1) return -1;
      if (openTag !== -1 && openTag < closeTag) {
        depth++;
        i = openTag + 4;
      } else {
        depth--;
        i = closeTag + 6;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  for (const box of boxes) {
    const boxEnd = findMatchingBoxEnd(box);
    if (boxEnd === -1) continue;
    const content = box.slice(0, boxEnd);

    // Image
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
    const image = imgMatch ? imgMatch[1].trim() : '';

    // Big name (first <p> after image)
    const nameMatch = content.match(/<p[^>]*>([^<]+)<\/p>/);
    let name = nameMatch ? cleanText(nameMatch[1]) : '';

    // Content inside .content (up to the addToCart button and closing </div>)
    const contentMatch = content.match(/<div class="content">([\s\S]*?)<a[^>]*addToCart[^>]*>[\s\S]*?<\/a>\s*<\/div>/);
    const inner = contentMatch ? contentMatch[1] : '';

    // H3 fallback / confirmation
    const h3Match = inner.match(/<h3>([^<]+)<\/h3>/);
    if (h3Match && !name) name = cleanText(h3Match[1]);

    // Description
    const descMatch = inner.match(/<h3>[^<]+<\/h3>\s*<p>([\s\S]*?)<\/p>/);
    const description = descMatch ? cleanText(descMatch[1]) : '';

    // Price and original price
    const priceMatch = inner.match(/<div class="price">Rs\.(\d+)(?:\s*<span>Rs\.(\d+)<\/span>)?/);
    const price = priceMatch ? parseInt(priceMatch[1], 10) : 0;
    const originalPrice = priceMatch && priceMatch[2] ? parseInt(priceMatch[2], 10) : null;

    // Fallback from addToCart if price missing
    const cartMatch = inner.match(/addToCart\('((?:\\'|[^'])+)',\s*(\d+),\s*'((?:\\'|[^'])+)'/);
    if (!name && cartMatch) name = cartMatch[1].replace(/\\'/g, "'");
    if (!price && cartMatch) price = parseInt(cartMatch[2], 10);
    if (!image && cartMatch) image = cartMatch[3];

    if (!name || !image) {
      console.warn('Skipping incomplete product in', path.basename(file), '— name:', name, 'image:', image ? 'yes' : 'no');
      continue;
    }

    products.push({
      name,
      description,
      price,
      originalPrice,
      image,
      category,
      page: path.basename(file),
      inStock: true,
      active: true
    });
  }

  return products;
}

let all = [];
for (const [file, category] of Object.entries(categoryMap)) {
  const filePath = path.join(coffeeDir, file);
  if (!fs.existsSync(filePath)) {
    console.warn('File not found:', file);
    continue;
  }
  const products = extractProducts(filePath, category);
  console.log(`${file}: extracted ${products.length} products`);
  all = all.concat(products);
}

const output = path.resolve(__dirname, '../seed/extracted-products.json');
fs.writeFileSync(output, JSON.stringify(all, null, 2));
console.log(`\nTotal extracted: ${all.length} products`);
console.log('Saved to:', output);
