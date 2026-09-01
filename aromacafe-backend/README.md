# Aroma Cafe Backend

Express + MongoDB API for authentication, products, addresses, and orders.

## 1. Set up MongoDB Atlas (free, ~5 minutes)

1. Go to https://www.mongodb.com/cloud/atlas/register and sign up (Google sign-in is fastest).
2. Create a free **M0** cluster (any region close to you is fine).
3. Under **Database Access**, add a database user with a username + password (save these).
4. Under **Network Access**, click **Add IP Address** → **Allow Access From Anywhere** (0.0.0.0/0) — fine for development.
5. Click **Connect** on your cluster → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your real values, and add `/aromacafe` before the `?` so it points at a database named `aromacafe`:
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/aromacafe?retryWrites=true&w=majority
   ```

## 2. Configure the project

```bash
cd aromacafe-backend
npm install
cp .env.example .env
```

Open `.env` and fill in:
- `MONGO_URI` — the connection string from step 1.6 above
- `JWT_SECRET` — any long random string (e.g. run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` to generate one)
- `CLIENT_ORIGIN` — the URL your frontend runs on (default assumes Live Server on `http://127.0.0.1:5500`)

## 3. Run it

```bash
npm run dev     # auto-restarts on file changes (needs nodemon, already in devDependencies)
# or
npm start       # plain node
```

You should see:
```
✅ MongoDB connected
🚀 Aroma Cafe API running on http://localhost:5000
```

Visit `http://localhost:5000/api/health` in a browser — you should see `{"status":"ok"}`.

## 4. Seed the product catalog

```bash
node seed/products.js
```

This populates the `products` collection in MongoDB from the catalog in `coffee/c.js`.

## API Reference

| Method | Route                              | Auth?   | Body / Query                                               |
|--------|------------------------------------|---------|------------------------------------------------------------|
| POST   | `/api/auth/register`               | No      | `{ name, email, password, phone }`                         |
| POST   | `/api/auth/login`                  | No      | `{ email, password }`                                      |
| GET    | `/api/users/me`                    | Yes     | —                                                          |
| PUT    | `/api/users/me`                    | Yes     | `{ name, phone, email }`                                   |
| POST   | `/api/users/me/addresses`          | Yes     | `{ label, line1, line2, city, state, pincode, isDefault }` |
| PUT    | `/api/users/me/addresses/:id`      | Yes     | any of the address fields above                            |
| DELETE | `/api/users/me/addresses/:id`      | Yes     | —                                                          |
| GET    | `/api/users/me/cart`               | Yes     | —                                                          |
| PUT    | `/api/users/me/cart`               | Yes     | `{ cart: [{name, price, image, qty}] }`                    |
| DELETE | `/api/users/me/cart`               | Yes     | —                                                          |
| GET    | `/api/orders`                      | Yes     | —                                                          |
| POST   | `/api/orders`                      | Yes     | `{ items: [{name, price, img, qty}], total, address }`     |
| GET    | `/api/products`                    | No      | `?category=...&search=...`                                 |
| GET    | `/api/products/:id`                | No      | —                                                          |
| GET    | `/api/admin/orders`                | Admin   | —                                                          |
| PUT    | `/api/admin/orders/:id/status`     | Admin   | `{ status }`                                               |

"Auth? Yes" routes require an `Authorization: Bearer <token>` header. The token comes back
from `/api/auth/register` and `/api/auth/login`.

## 5. Deployment notes

- Host the backend on Render, Railway, Fly.io, or any Node.js host.
- Set `MONGO_URI` to your Atlas cluster, `JWT_SECRET` to a random string, and `CLIENT_ORIGIN` to your hosted frontend URL.
- Run `node seed/products.js` once after the first deploy to populate the catalog.
- In the frontend, set `window.API_BASE` to your hosted backend's `/api` URL before `c.js` loads:
  ```html
  <script>window.API_BASE = 'https://your-backend.onrender.com/api';</script>
  <script src="c.js"></script>
  ```
