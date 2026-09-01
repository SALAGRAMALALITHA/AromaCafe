const fs = require('fs');
const path = require('path');

const products = JSON.parse(fs.readFileSync(path.join(__dirname, '../seed/extracted-products.json'), 'utf-8'));

const pageMap = {
  'Hot Drinks':   { file: 'hot.html',   title: 'Hot Beverages',   heading: 'Hot Beverages' },
  'Cold Drinks':  { file: 'cold.html',  title: 'Cold Beverages',  heading: 'Cold Beverages' },
  'Refreshments': { file: 'fresh.html', title: 'Fresh Refreshments',heading: 'Fresh Refreshments' },
  'Combos':       { file: 'combo.html', title: 'Special Combos',  heading: 'Special Combos' },
  'Chocolates':   { file: 'choco.html', title: 'Chocolates',      heading: 'Chocolates' },
  'Desserts':     { file: 'dessert.html',title: 'Desserts',        heading: 'Desserts' },
  'Coffee Beans': { file: 'beans.html', title: 'Coffee Beans',    heading: 'Coffee Beans' },
  'Accessories':  { file: 'accessories.html', title: 'Accessories', heading: 'Accessories' },
  'Gifts':        { file: 'gifts.html', title: 'Gifts',           heading: 'Gifts' }
};

const coffeeDir = path.resolve(__dirname, '../../coffee');

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJs(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
}

for (const [category, meta] of Object.entries(pageMap)) {
  const items = products.filter(p => p.category === category);

  const cards = items.map(p => {
    const hasOriginal = p.originalPrice ? `<span>Rs.${p.originalPrice}</span>` : '';
    return `
            <div class="box" style="position:relative;overflow:hidden;">
                <div class="image-wrap">
                    <img src="${escapeAttr(p.image)}" alt="">
                </div>
                <p class="product-name">${escapeAttr(p.name)}</p>
                <div class="price">Rs.${p.price} ${hasOriginal}</div>
                <div class="desc-panel">
                    <p>${escapeAttr(p.description)}</p>
                </div>
                <a href="#" class="btn add-to-cart" onclick="addToCart('${escapeJs(p.name)}',${p.price},'${escapeJs(p.image)}');return false;">Add to Cart</a>
                <button type="button" class="btn show-desc" onclick="showDescription(this)">Description</button>
            </div>
    `;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer">
    <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet"/>
    <link rel="stylesheet" href="cf.css">
    <script src="c.js"></script>
    <title>${escapeAttr(meta.title)} - Aroma Cafe</title>
</head>
<body>
    <header id="site-header"></header>

    <section class="menu" id="menu" style="margin-top:100px;">
        <h1 class="heading">${escapeAttr(meta.heading)}</h1>
        <div class="box-container">
${cards}
        </div>
    </section>

    <div id="site-footer"></div>
</body>
</html>
`;

  fs.writeFileSync(path.join(coffeeDir, meta.file), html);
  console.log(`Generated ${meta.file} with ${items.length} products`);
}
