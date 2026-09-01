# Aroma Cafe Frontend

Static HTML/CSS/JS frontend for Aroma Cafe.

## Local development

1. Open the `coffee` folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `home.html` → **Open with Live Server**.
4. The backend must be running at `http://localhost:5000`.

## Connecting to a deployed backend

The frontend talks to the backend API defined in `c.js`:

```javascript
const API_BASE = (window.API_BASE || 'http://localhost:5000/api').replace(/\/$/, '');
```

For production, set `window.API_BASE` **before** `c.js` loads, for example by adding this in every HTML page:

```html
<script>
  window.API_BASE = 'https://your-backend.onrender.com/api';
</script>
<script src="c.js"></script>
```

Or replace the default URL in `c.js` with your deployed backend URL.

## Deployment options

The frontend can be deployed to any static host:

- **Netlify** or **Vercel**: drag and drop the `coffee` folder.
- **GitHub Pages**: enable Pages on the repo.
- **Firebase Hosting**: run `firebase deploy` from the `coffee` folder.

Make sure to set the backend `CLIENT_ORIGIN` to your deployed frontend URL so CORS allows requests.
