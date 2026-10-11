# NearBuy Customer Frontend

React + Vite + Tailwind CSS (v4), phone-first. Customer app only (Shop Owner, Captain and Admin are not part of this phase).

## Run

```bash
npm install
cp .env.example .env     # set BACKEND_URL if the backend is not on http://localhost:3000
npm run dev              # http://localhost:5173
```

The Vite dev server proxies `/api/*` (prefix stripped) and `/socket.io` to the backend, so the HTTP-only auth
cookie stays same-site. Backend `FRONTEND_URL` must be `http://localhost:5173`.
Seed demo shops first with `npm run seed:test-data` in the backend.

For a deployed build set `VITE_API_BASE_URL` (and `VITE_SOCKET_URL`) to the backend origin, and make sure the
backend allows that origin with credentials.

## Structure

```
src/
  config/        env.js, routes.js
  services/      apiClient.js (axios, cookies), api.js (all endpoints), normalizers.js, socket.js
  context/       Auth, Location, Cart (+ cross-shop dialog), Notification, Toast
  hooks/         useAsync, usePickupSharing
  routes/        AppRouter, ProtectedRoute / GuestRoute
  layouts/       AuthLayout, TabsLayout (bottom nav), StackLayout, PhoneFrame
  components/    ui/ (Button, Input, Modal, Skeleton ...), shared/ (ProductCard, ShopCard ...)
  features/      auth/, customer/{home,shops,products,cart,checkout,orders,notifications,profile}
  utils/         format, geo, orderMeta
```

Design tokens live in `src/index.css` (`@theme`).

## Routes

`/login` `/register` `/customer/home` `/customer/shops/:shopId` `/customer/products/:productId`
`/customer/cart` `/customer/checkout` `/customer/orders` `/customer/orders/:orderId`
`/customer/notifications` `/customer/profile`

## Backend assumptions to verify (not confirmed from controllers)

These come from the README only. Each is isolated in `services/api.js` or `services/normalizers.js`:

1. `POST /orders` body: `{ fulfillmentType, paymentMethod, payment: { method }, deliveryAddress, deliveryLocation: { latitude, longitude } }` (delivery fields only for delivery).
2. `POST /assessment/shops` body `{ latitude, longitude }`; response a list (or `{ shops }`), items either a shop or `{ shop, distanceKm }`.
   If it returns nothing, the home page lists shops derived from `/shop-products`.
3. `POST /cart` body `{ productId, quantity }`; `PUT /cart/:productId` body `{ quantity }`.
4. Register body `{ name, email, phone, password }`; profile from `GET /User/profile` as `{ customer }`, `{ user }` or a plain object.
5. Socket events send `{ orderId }` (join, stop) and `{ orderId, latitude, longitude }` (update).
6. Image paths that start with `/` are resolved against `VITE_API_BASE_URL`.
7. `DELETE /cart/clear` may be shadowed by `DELETE /cart/:productId` in the backend route order; test it.

## Known limits (backend does not provide these)

- No address text for saved location: only coordinates are stored. The delivery address is typed at checkout and
  remembered locally (browser storage) as a convenience.
- No ratings, delivery estimates, discounts or expiry data, so the UI does not show them.
- No server-side search: search filters loaded products and shops in the browser.
- No documented customer-side delivery tracking or notification socket events: order status refreshes every 15 s
  and the notification badge every 60 s. Pickup location sharing uses the documented pickup events.
- No customer profile update endpoint, so profile is read-only apart from location.
