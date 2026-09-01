const fs = require('fs');
const path = require('path');

const cjsPath = path.resolve(__dirname, '../../coffee/c.js');
const productsPath = path.resolve(__dirname, '../seed/extracted-products.json');

const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

const jsArray = '[\n' + products.map(p => {
  const base = `  { name: '${p.name.replace(/'/g, "\\'")}', price: ${p.price}, category: '${p.category}', page: '${p.page}',
    image: '${p.image.replace(/'/g, "\\'")}' }`;
  return base;
}).join(',\n') + '\n]';

let cjs = fs.readFileSync(cjsPath, 'utf-8');
const markerStart = 'const PRODUCT_DB = [';
const markerEnd = '];\n\n/* Load products from the backend';

const startIdx = cjs.indexOf(markerStart);
const endIdx = cjs.indexOf(markerEnd);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find PRODUCT_DB boundaries in c.js');
  process.exit(1);
}

const suffix = cjs.slice(endIdx + 2);  // after the closing '];'
cjs = cjs.slice(0, startIdx) + 'const PRODUCT_DB = ' + jsArray + ';' + suffix;

fs.writeFileSync(cjsPath, cjs);
console.log(`Synced ${products.length} products into coffee/c.js PRODUCT_DB fallback`);
