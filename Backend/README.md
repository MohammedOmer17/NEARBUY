# NearBuy Backend

NearBuy is a hyperlocal grocery platform that connects customers to nearby kirana shops. Each shop manages its own products, pricing, units, and stock. This backend focuses on the shop-owner and customer flow required for local grocery ordering and sales management.

## Technology Stack

### In Use

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT for authentication
- bcrypt for password hashing
- HTTP-only cookies for session handling
- Postman for API testing

### Planned or Future Integrations

- Google Maps / location services
- Socket.IO for real-time updates
- Razorpay for payments
- Captain / delivery fulfillment service
- Live order tracking
- Frontend dashboard and charts

These are not part of the current backend implementation.

## Current Architecture

The backend now supports the following core roles and flows:

1. Customer
   - register/login/logout
   - browse shop products
   - manage cart
   - place orders
   - view order history
   - cancel eligible orders

2. Shop Owner
   - register/login/logout
   - manage their shop
   - create and manage shop products
   - update stock
   - view sales analytics for their own shop

3. Shop
   - linked to a specific shop owner
   - created during registration
   - used for product and sales ownership

## Project Structure

```text
Backend/
├── Controllers/
│   ├── CustomerController.js
│   ├── cartController.js
│   ├── orderController.js
│   ├── salesController.js
│   ├── shopController.js
│   ├── shopOwnerController.js
│   └── shopProductController.js
├── Middlewares/
│   └── authMiddleware.js
├── db/
│   └── db.js
├── models/
│   ├── blackListTokenModel.js
│   ├── Cart.js
│   ├── CustomerModel.js
│   ├── Order.js
│   ├── ShopModel.js
│   ├── ShopOwnerModel.js
│   ├── ShopProduct.js
│   └── blackListTokenModel.js
├── routes/
│   ├── cartRoutes.js
│   ├── CustomerRoutes.js
│   ├── orderRoutes.js
│   ├── salesRoutes.js
│   ├── shopOwnerRoutes.js
│   ├── shopProductRoutes.js
│   └── salesRoutes.js
├── services/
│   └── CustomerService.js
├── .env
├── app.js
├── package.json
├── README.md
├── server.js
└── node_modules/
```

## Implemented Features

### 1. Authentication

#### Customer authentication
- Customer registration
- Customer login
- Customer logout
- JWT-based auth
- HTTP-only cookies
- Customer profile retrieval

#### Shop owner authentication
- Shop owner registration
- Shop owner login
- Shop owner logout
- JWT-based auth
- cookie-based session management
- owner-scoped profile lookup

### 2. Shop Module

- Shop owner owns a shop
- Shop stores shop name, address, contact, location, and status
- Shop is created automatically during shop owner registration
- The relationship is:

```text
ShopOwner -> Shop
```

### 3. Product Module

The backend includes a separate `ShopProduct` model to avoid a global product catalog.

Each product belongs to a specific shop and contains:

- `shop`
- `name`
- `description`
- `category`
- `brand`
- `image`
- `price`
- `unit`
- `quantity`
- `lowStockThreshold`
- `isAvailable`
- timestamps

Shop owners can:
- create products
- view their shop's products
- update product details
- delete products
- update product stock

Customers can:
- browse products by shop
- view specific product details

### 4. Cart Module

The backend includes a customer cart model that holds products from only one shop at a time.

Cart functionality includes:
- get current cart
- add product to cart
- update item quantity
- remove item from cart
- clear cart

Rules:
- customers cannot mix products from different shops in one cart
- quantity is checked against available stock
- cart item prices are revalidated from the product database during checkout

### 5. Order Module

The order system stores a snapshot of products so historical orders remain consistent even if the product is edited later.

Order fields include:
- customer
- shop
- items
- totalAmount
- fulfillmentType
- orderStatus
- deliveryAddress
- timestamps

Supported fulfillment types:
- `pickup`
- `delivery`

Supported order statuses:
- `placed`
- `accepted`
- `preparing`
- `ready`
- `picked_up`
- `out_for_delivery`
- `completed`
- `cancelled`

Order functionality includes:
- create order from cart
- confirm order and reduce stock
- clear the cart after successful order
- view customer order history
- view specific order details
- cancel eligible orders
- restore stock on cancellation when allowed

### 6. Sales Analytics Module

The new recent feature added is the Shop Owner sales dashboard analytics module.

The backend now exposes:

- `GET /sales/summary`
- `GET /sales/statistics`
- `GET /sales/trends`
- `GET /sales/top-products`

These are calculated from the existing `Order` collection using MongoDB aggregation pipelines.

#### Sales Summary
Returns:
- `totalSales`
- `totalOrders`
- `completedOrders`
- `cancelledOrders`
- `averageOrderValue`

#### Sales Statistics
Returns:
- `totalOrders`
- `completedOrders`
- `cancelledOrders`
- `totalSales`
- `averageOrderValue`
- `totalItemsSold`
- `pickupOrders`
- `deliveryOrders`

#### Sales Trends
Supports:
- `daily`
- `weekly`
- `monthly`

Example:

```text
GET /sales/trends?period=daily
GET /sales/trends?period=weekly
GET /sales/trends?period=monthly
GET /sales/trends?period=daily&startDate=2026-09-01&endDate=2026-09-30
```

Returns chart-friendly data: date or period, total sales, and order count.

#### Top Selling Products
Returns products sorted by quantity sold.

Example response fields:
- `product`
- `name`
- `unit`
- `quantitySold`
- `revenue`

This module is restricted to the authenticated shop owner and is computed from the owner’s own shop only.

## Important Security Rules

The implementation follows these safety rules:

- Shop owners must use `req.user._id` to identify themselves
- Shop owners can only access their own shop data
- Customers can only view their own orders and carts
- No arbitrary `shopId` or `customerId` from request bodies is trusted for authorization
- Product prices and totals are validated server-side
- Stock is reduced only after successful order creation
- Database transaction/session logic is used for order creation and stock updates

## CommonJS Standard

The project follows CommonJS throughout:

```js
const Model = require("../models/Model");

module.exports = {
  functionName,
};
```

No ES module syntax is used.

## Routes Summary

### Customer auth
```text
POST /User/register
POST /User/login
GET  /User/profile
POST /User/logout
```

### Shop owner auth
```text
POST /shop-owner/register
POST /shop-owner/login
POST /shop-owner/logout
GET  /shop-owner/me
```

### Products
```text
POST   /shop-products
GET    /shop-products/shop/:shopId
GET    /shop-products/:productId
PUT    /shop-products/:productId
DELETE /shop-products/:productId
PATCH  /shop-products/:productId/stock
```

### Cart
```text
GET    /cart
POST   /cart
PUT    /cart/:productId
DELETE /cart/:productId
DELETE /cart/clear
```

### Orders
```text
POST   /orders
GET    /orders
GET    /orders/:orderId
PUT    /orders/:orderId/cancel
```

### Sales analytics
```text
GET /sales/summary
GET /sales/statistics
GET /sales/trends
GET /sales/top-products
```

## Configuration

Create a local `.env` file with values like:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/nearbuy
JWT_SECRET=your_local_jwt_secret
NODE_ENV=development
```

## Run the Project

```bash
npm install
node server.js
```

## Development Status

This backend has reached the following implemented maturity:

- customer auth
- shop owner auth
- shop model
- shop products
- customer cart
- order lifecycle
- sales dashboard analytics

The following are not implemented yet and remain planned for later phases:

- Captain / delivery partner module
- live tracking
- maps services
- payment integration
- socket.io real-time updates
- frontend dashboard UI

## Verification

The backend module structure and recent sales module were checked for syntax/loading validity using Node require validation, and no errors were reported in the current project workspace.


### Implemented

- Express application and server entry point
- MongoDB/Mongoose connection helper
- Customer, ShopOwner, Shop, and blacklist token models
- Customer authentication model, controller, and routes are present (mounted at `/User`); the flow is not marked complete or verified end-to-end
- ShopOwner registration with Shop creation and rollback attempt on Shop failure
- ShopOwner login, logout, JWT cookie, and profile retrieval
- ShopOwner authentication middleware
- ShopOwner route module
- Shop controller handlers for owner-scoped read/update/status and public Shop lookup (not mounted as routes)
- Manual Postman test cases can be run; no Postman collection is checked in

### Planned / Upcoming

1. Shop management API routes and complete Shop management endpoint exposure
2. Shop Product model
3. Product CRUD
4. Stock management
5. Low-stock alerts
6. Customer product browsing
7. Cart
8. Order management
9. Pickup and delivery fulfillment
10. Captain authentication
11. Captain delivery management
12. Google Maps integration
13. Live Captain location tracking using Socket.IO
14. Razorpay payment integration
15. Notifications
16. Automatic shop assessment/assignment engine

The Postman collection and automated API test suite are also not yet checked in.

## NearBuy Order Concept

The following flow is part of the planned architecture and is **not implemented yet**:

```text
Customer
   ↓
Select Shop
   ↓
Select Products
   ↓
Cart
   ↓
Choose Fulfillment
   ├── Pickup
   │      ↓
   │   Customer collects from Shop
   │
   └── Delivery
          ↓
       Captain Assigned
          ↓
       Pickup from Shop
          ↓
       Out for Delivery
          ↓
       Customer Receives Order
```

## Coding Conventions

Most backend controllers, routes, and models use CommonJS:

- `require()` for imports
- `module.exports` for exports
- Express controllers for request handling
- Express routers for endpoint definitions
- Mongoose models for persistence
- Environment configuration in `.env`

Example:

```js
const Shop = require('../models/ShopModel');
```

```js
module.exports = {
  registerShopOwner,
  loginShopOwner,
  logoutShopOwner,
  getShopOwnerProfile,
};
```

> `CustomerModel.js` currently uses ES module syntax while most backend files use CommonJS. This is a known consistency issue; the README does not imply the entire codebase is already CommonJS-only.

## Why ShopOwner and Shop Are Separate

```text
ShopOwner = Who owns the shop?
Shop      = What is the physical/business shop?
```

Separating authentication/account data from shop business data keeps credentials out of shop records and makes future products, inventory, orders, and shop-management functionality easier to develop independently.

## Future Architecture

This high-level architecture is planned; the product, inventory, order, Captain, and tracking modules shown below have not been implemented:

```text
Customer
   │
   ├── Authentication
   ├── Browse Products
   ├── Cart
   └── Orders
          │
          ↓
        Shop
          │
          ├── Products
          ├── Inventory
          └── Orders
                 │
                 ↓
              Captain
                 │
                 └── Delivery + Live Tracking
```

NearBuy is under active development. Additional modules will be added incrementally as the platform evolves.