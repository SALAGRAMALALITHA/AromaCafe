# Aroma Cafe

A full-stack coffee shop e-commerce application with a static HTML/CSS/JS frontend, a Node.js/Express backend, and MongoDB persistence.

## Tech Stack

- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend:** Node.js + Express 4
- **Database:** MongoDB + Mongoose 8
- **Authentication:** JWT + bcryptjs
- **API Style:** REST API consumed with `fetch()`

## Project Structure

```
AromaCafe/
├── coffee/              # Static frontend
│   ├── home.html        # Landing page
│   ├── hot.html         # Menu category pages
│   ├── beans.html       # Product category pages
│   ├── cart.html        # Shopping cart + checkout
│   ├── account.html     # User profile + saved addresses
│   ├── admin.html       # Admin order management
│   ├── c.js             # Shared frontend logic, API calls, cart
│   └── cf.css           # Shared styles
│
└── aromacafe-backend/   # Node.js/Express API
    ├── server.js
    ├── models/          # Mongoose models
    ├── routes/          # API routes
    ├── seed/            # Product seeding
    └── scripts/         # Utilities
```

## Features

- Customer registration, login, and profile management
- Saved delivery addresses with default-address support
- 47-product catalog across 9 categories
- Product cards with image, name, price, description panel, and Add to Cart
- Cart with quantity controls and backend sync when logged in
- Checkout with address selection and order history
- Admin order viewing and status management
- Backend-managed product catalog via MongoDB
- Responsive layout for mobile and desktop

## Quick Start

### 1. Backend

```bash
cd aromacafe-backend
npm install
cp .env.example .env
```

Fill `.env` with your `MONGO_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN`.

```bash
npm run dev
node seed/products.js
```

### 2. Frontend

Open `coffee/home.html` with the VS Code Live Server extension, or any static server.

For production, set `window.API_BASE` in each page before `c.js` loads:

```html
<script>
  window.API_BASE = 'https://your-backend.onrender.com/api';
</script>
<script src="c.js"></script>
```

## API Reference

| Method | Route                              | Auth?   | Description                          |
|--------|------------------------------------|---------|--------------------------------------|
| POST   | `/api/auth/register`               | No      | Register a customer                  |
| POST   | `/api/auth/login`                  | No      | Login and receive JWT                |
| GET    | `/api/users/me`                    | Yes     | Get current user                     |
| POST   | `/api/users/me/addresses`          | Yes     | Add a delivery address               |
| GET    | `/api/users/me/cart`               | Yes     | Get cart (synced across devices)     |
| PUT    | `/api/users/me/cart`               | Yes     | Save cart                            |
| DELETE | `/api/users/me/cart`               | Yes     | Clear cart                           |
| GET    | `/api/orders`                      | Yes     | Get customer order history           |
| POST   | `/api/orders`                      | Yes     | Place a new order                    |
| GET    | `/api/products`                    | No      | List products (category/search)      |
| GET    | `/api/admin/orders`                | Admin   | List all orders                      |
| PUT    | `/api/admin/orders/:id/status`     | Admin   | Update order status                  |

## Deployment

- **Backend:** Render, Railway, Fly.io, or any Node.js host
- **Frontend:** Netlify, Vercel, GitHub Pages, or any static host
- After first deploy, run `node seed/products.js` to populate the catalog

See `coffee/README.md` and `aromacafe-backend/README.md` for more detailed setup and deployment instructions.
