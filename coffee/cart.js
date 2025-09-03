// // Add to Cart function used in product pages
// function addToCart(name, price, image) {
//     let cart = JSON.parse(localStorage.getItem('cart')) || [];

//     const existing = cart.find(item => item.name === name);
//     if (existing) {
//         existing.quantity += 1;
//     } else {
//         cart.push({ name, price, quantity: 1, image });
//     }

//     localStorage.setItem('cart', JSON.stringify(cart));

    // ✅ Show banner at top instead of alert
function showBanner(message) {
    let banner = document.getElementById("cart-banner");
    if (!banner) {
        banner = document.createElement("div");
        banner.id = "cart-banner";
        banner.style.position = "fixed";
        banner.style.top = "0";
        banner.style.left = "0";
        banner.style.width = "100%";
        banner.style.backgroundColor = "#2a1503";
        banner.style.color = "#fff";
        banner.style.textAlign = "center";
        banner.style.padding = "10px";
        banner.style.zIndex = "9999";
        document.body.appendChild(banner);
    }

    banner.textContent = message;
    banner.style.display = "block";

    setTimeout(() => {
        banner.style.display = "none";
    }, 2000);
}

function searchFunction(name){
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let result = products.filter(product =>
        product.name.toLowerCase().includes(name.toLowerCase())
    );
    return result;
}

// Updated Add to Cart function
function addToCart(name, price, image) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1, image });
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    // ✅ Show non-blocking message, don't redirect
    showBanner(`${name} successfully added to cart!`);
}


// On cart.html, populate items
if (window.location.pathname.includes("cart.html")) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.querySelector(".cart-items");
    const totalElement = document.querySelector(".total");

    function updateCartDisplay() {
        cartItemsContainer.innerHTML = "";
        let total = 0;

        cart.forEach((item, index) => {
            total += item.price * item.quantity;

            const li = document.createElement("li");
            li.innerHTML = `
                <div>
                    <strong>${item.name}</strong><br>
                    ₹${item.price} x <span class="qty">${item.quantity}</span>
                </div>
                <div>
                    <button onclick="changeQty(${index}, -1)">-</button>
                    <button onclick="changeQty(${index}, 1)">+</button>
                </div>
            `;
            cartItemsContainer.appendChild(li);
        });

        totalElement.textContent = `Total: ₹${total.toFixed(2)}`;
    }

    window.changeQty = (index, delta) => {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartDisplay();
    };

    updateCartDisplay();
}
function checkout() {
    alert("Thank you for your purchase!");
    localStorage.removeItem("cart");
    location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartItemsContainer = document.querySelector(".cart-items");
    const productContainer = document.getElementById("product-container");
    const totalElement = document.querySelector(".total");

    let total = 0;
    cartItemsContainer.innerHTML = "";
    productContainer.innerHTML = "";

    cart.forEach((item, index) => {
        total += item.price * item.quantity;

        // 🧾 Cart Summary Item
        const summaryItem = document.createElement("li");
        summaryItem.innerHTML = `
            <div><strong>${item.name}</strong><br>₹${item.price} x ${item.quantity}</div>
        `;
        cartItemsContainer.appendChild(summaryItem);

        // 🛍 Product Display
        const productCard = document.createElement("div");
        productCard.className = "product";
        productCard.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="product-details">
                <h2>${item.name}</h2>
                <p>₹${item.price}</p>
                <div class="quantity-controls">
                    <button onclick="updateQty(${index}, -1)">-</button>
                    <span class="qty">${item.quantity}</span>
                    <button onclick="updateQty(${index}, 1)">+</button>
                    <button onclick="removeItem(${index})" style="margin-left:10px; background:red;">Remove</button>
                </div>
            </div>
        `;
        productContainer.appendChild(productCard);
    });

    totalElement.textContent = `Total: ₹${total.toFixed(2)}`;
});

function updateQty(index, delta) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    location.reload();
}

function removeItem(index) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    location.reload();
}

