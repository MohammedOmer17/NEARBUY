# NearBuy Backend

NearBuy is a hyperlocal digital commerce backend built for connecting customers with nearby local and kirana shops. The backend exposes REST APIs for customer authentication, shop management, cart and order workflows, captain delivery operations, payment status tracking, notifications, maps-based route lookups, and admin monitoring.

This project is implemented using Node.js, Express.js, MongoDB, and Mongoose with CommonJS modules (`require` / `module.exports`) throughout the codebase.

## 1. About the Project

NearBuy is designed around a local commerce workflow where:

- Customers can register, log in, manage their profile, and track their location.
- Shop owners can register, manage shop information, configure payment details, and list products.
- Customers can browse products, add items to a cart, and place orders.
- Shop owners can accept orders and update their order status.
- Captains can accept delivery workflows, update availability, and complete deliveries.
- Admins can manage platform-wide entities and view aggregate dashboard metrics.

The backend acts as the API layer between the frontend, MongoDB, and business logic that governs customer, shop, captain, and admin flows.

## 2. Current Development Status

The following backend features are currently implemented in the codebase:

### Customer features
- Customer registration
- Customer login
- Customer logout
- JWT-based authentication
- Token verification middleware
- Token blacklist/logout handling
- Customer profile retrieval
- Customer location fetch and update

### Shop Owner features
- Shop owner registration
- Shop owner login
- Shop owner logout
- Shop owner profile retrieval
- Shop owner payment configuration
- Shop creation and shop ownership tracking
- Product creation, listing, update, deletion, and stock updates
- Shop-level sales analytics

### Cart and Order features
- Cart creation and management
- Add/update/remove cart items
- Cart clearing
- Order creation from cart
- Customer order listing and order lookup
- Order cancellation
- Shop order approval and status updates
- Payment confirmation flows for UPI and COD
- Payment tracking for customer and shop flows

### Captain features
- Captain registration
- Captain login
- Captain logout
- Captain profile management
- Captain password update
- Captain availability updates
- Captain location tracking
- Current delivery retrieval
- Delivery arrival, pickup, start, and completion steps
- Delivery payment collection
- Delivery history

### Maps, notifications, and assessment
- Google Maps route/service endpoints for captain and shop movement
- Notification creation and retrieval for multiple user roles
- Notification read/unread handling
- Assessment endpoint for shop recommendations

### Admin features
- Admin registration
- Admin login
- Admin logout
- Admin profile retrieval
- Customer management
- Shop owner management
- Shop management
- Captain management
- Order management
- Dashboard statistics
- Payment statistics and sales stats

## 3. Tech Stack

| Technology | Purpose |
| --- | --- |
| Node.js | JavaScript runtime for the backend server |
| Express.js | Web framework for routing, middleware, and API handling |
| MongoDB | Primary database for persistent application data |
| Mongoose | MongoDB schema modeling and validation |
| JWT | Authentication and authorization tokens |
| bcrypt | Password hashing |
| cookie-parser | Reading and setting HTTP-only cookies |
| CORS | Cross-origin resource sharing support |
| Socket.IO | Real-time communication support |
| Google Maps API | Route and location-based lookup support |
| Express Validator | Request validation for registration and login flows |

## 4. Backend Folder Structure

```text
Backend/
├── .env
├── .gitignore
├── app.js
├── server.js
├── package.json
├── package-lock.json
├── README.md
├── Controllers/
│   ├── adminController.js
│   ├── assessmentController.js
│   ├── captainController.js
│   ├── cartController.js
│   ├── CustomerController.js
│   ├── googleMapsController.js
│   ├── notificationController.js
│   ├── orderController.js
│   ├── paymentController.js
│   ├── salesController.js
│   ├── shopController.js
│   ├── shopOwnerController.js
│   └── shopProductController.js
├── db/
│   └── db.js
├── Middlewares/
│   ├── adminMiddleware.js
│   └── authMiddleware.js
├── models/
│   ├── AdminModel.js
│   ├── blackListTokenModel.js
│   ├── CaptainModel.js
│   ├── Cart.js
│   ├── CustomerModel.js
│   ├── Notification.js
│   ├── Order.js
│   ├── ShopModel.js
│   ├── ShopOwnerModel.js
│   └── ShopProduct.js
├── routes/
│   ├── adminRoutes.js
│   ├── assessmentRoutes.js
│   ├── captainRoutes.js
│   ├── cartRoutes.js
│   ├── CustomerRoutes.js
│   ├── googleMapsRoutes.js
│   ├── notificationRoutes.js
│   ├── orderRoutes.js
│   ├── salesRoutes.js
│   ├── shopOwnerRoutes.js
│   └── shopProductRoutes.js
├── services/
│   ├── adminService.js
│   ├── assessmentService.js
│   ├── CustomerService.js
│   ├── googleMapsService.js
│   ├── notificationService.js
│   ├── paymentService.js
│   └── socketService.js
└── node_modules/
```

## 5. Folder & File Explanation

### `Controllers/`
The controller layer handles HTTP request logic and dispatches business operations to models and services.

Important controller files:
- `CustomerController.js` - customer authentication and profile handling
- `shopOwnerController.js` - shop owner authentication and profile flow
- `shopProductController.js` - product management operations
- `cartController.js` - cart operations
- `orderController.js` - order creation, listing, cancellation, and status updates
- `paymentController.js` - customer/shop/captain payment-related flows
- `captainController.js` - captain lifecycle and delivery management
- `googleMapsController.js` - route and map-based delivery lookup endpoints
- `notificationController.js` - in-app notifications
- `salesController.js` - shop sales analytics
- `adminController.js` - admin operations and dashboard metrics
- `assessmentController.js` - shop assessment logic

### `models/`
This folder contains MongoDB/Mongoose models used for persistence and validation.

Important models:
- `CustomerModel.js` - customer profile and authentication data
- `ShopOwnerModel.js` - shop owner profile and status information
- `ShopModel.js` - shop record with owner relation, location, and payment details
- `ShopProduct.js` - product catalog attached to a shop
- `Cart.js` - cart and cart item data for customers
- `Order.js` - order snapshot, payment, fulfillment, and delivery state
- `CaptainModel.js` - captain identity, location, availability, and delivery data
- `Notification.js` - notification records for customer, owner, and captain roles
- `AdminModel.js` - admin authentication and role model
- `blackListTokenModel.js` - invalidated JWT storage for logout support

### `routes/`
The route layer defines the public API surface for the backend.

Important route files:
- `CustomerRoutes.js` - customer auth and location endpoints
- `shopOwnerRoutes.js` - shop owner authentication and payment endpoints
- `shopProductRoutes.js` - product endpoints
- `cartRoutes.js` - cart endpoints
- `orderRoutes.js` - customer/shop order flow endpoints
- `captainRoutes.js` - captain profile and delivery endpoints
- `googleMapsRoutes.js` - maps route endpoints
- `notificationRoutes.js` - notification endpoints
- `salesRoutes.js` - shop owner sales analytics endpoints
- `adminRoutes.js` - admin management endpoints
- `assessmentRoutes.js` - assessment endpoint

### `Middlewares/`
Middleware contains authentication and authorization checks.

- `authMiddleware.js` contains `authCustomer`, `authShopOwner`, `authCaptain`, and `authAnyUser` logic
- `adminMiddleware.js` contains admin-only authentication logic

### `db/`
- `db.js` handles MongoDB connection using `MONGODB_URI`

### `services/`
The service layer contains reusable logic for cross-cutting features.

Important service files:
- `CustomerService.js` - customer business logic
- `assessmentService.js` - shop assessment logic
- `googleMapsService.js` - map/distance integration logic
- `notificationService.js` - centralized notification logic
- `paymentService.js` - payment validation and status updates
- `socketService.js` - socket-based real-time communication support
- `adminService.js` - dashboard and aggregate query logic

### Root files
- `app.js` - Express app setup, middleware registration, route mounting
- `server.js` - database connection, HTTP server startup, socket initialization
- `package.json` - project dependencies and package metadata
- `.env` - environment configuration file used locally
- `.gitignore` - ignores `.env` and `node_modules/`

## 6. Database Architecture

The backend uses MongoDB with Mongoose schemas to model application data.

### Customer
Model: `Customer`

Purpose:
- Stores customer authentication and profile data

Important fields:
- `name`
- `email`
- `phone`
- `password` (hashed)
- `location.latitude`
- `location.longitude`
- `locationUpdatedAt`
- `isVerified`
- `isActive`
- timestamps

Relationships:
- A customer creates orders and carts

### Shop Owner
Model: `ShopOwner`

Purpose:
- Stores shop owner credentials, status, and profile information

Important fields:
- `name`
- `email`
- `phone`
- `password`
- `isVerified`
- `isActive`
- `accountStatus` (`pending`, `approved`, `suspended`, `rejected`)
- timestamps

Relationships:
- One shop owner can own one shop through the `owner` field inside `Shop`

### Shop
Model: `Shop`

Purpose:
- Stores the shop profile and owner relationship

Important fields:
- `owner` (ObjectId reference to `ShopOwner`)
- `shopName`
- `address`
- `location.latitude`
- `location.longitude`
- `contact`
- `paymentDetails.upiId`
- `paymentDetails.qrCode`
- `status` (`active`, `inactive`, `suspended`)
- timestamps

Relationships:
- Each shop belongs to a single shop owner
- Products and orders refer to a shop

### Shop Product
Model: `ShopProduct`

Purpose:
- Stores products for a specific shop

Important fields:
- `shop` (ObjectId reference to `Shop`)
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

Relationships:
- Products belong to a specific shop and are used in cart and order snapshots

### Cart
Model: `Cart`

Purpose:
- Stores customer cart data before checkout

Important fields:
- `customer` (ObjectId reference to `Customer`)
- `shop` (ObjectId reference to `Shop`)
- `items[]`
- timestamps

Relationships:
- A cart is linked to exactly one customer and usually one shop

### Order
Model: `Order`

Purpose:
- Stores order snapshots for customer purchase history and lifecycle tracking

Important fields:
- `customer` (ObjectId reference to `Customer`)
- `shop` (ObjectId reference to `Shop`)
- `captain` (ObjectId reference to `Captain`, optional)
- `items[]`
- `totalAmount`
- `fulfillmentType` (`pickup` or `delivery`)
- `orderStatus` (`placed`, `accepted`, `preparing`, `ready`, `picked_up`, `out_for_delivery`, `completed`, `cancelled`)
- `deliveryAddress`
- `deliveryLocation`
- `payment.method` (`shop_upi`, `cod`)
- `payment.status` (`pending`, `customer_marked_paid`, `paid`)
- `delivery.*` timestamps
- timestamps

Relationships:
- Orders are tied to a customer, shop, and optionally a captain

### Captain
Model: `Captain`

Purpose:
- Stores delivery partner information

Important fields:
- `name`
- `email`
- `phone`
- `password`
- `vehicle`
- `location.latitude`
- `location.longitude`
- `locationUpdatedAt`
- `isVerified`
- `isActive`
- `availabilityStatus` (`offline`, `available`, `busy`)
- `accountStatus` (`pending`, `approved`, `rejected`, `suspended`)
- timestamps

Relationships:
- Captains are assigned to orders for deliveries

### Notification
Model: `Notification`

Purpose:
- Stores in-app notifications for different user roles

Important fields:
- `recipient` (ObjectId reference using polymorphic role)
- `recipientRole` (`customer`, `shopOwner`, `captain`)
- `type`
- `title`
- `message`
- `relatedEntity`
- `isRead`
- `readAt`
- timestamps

### Admin
Model: `Admin`

Purpose:
- Stores platform administrator credentials and profile data

Important fields:
- `name`
- `email`
- `password`
- `role` (`admin`)
- `isActive`
- `lastLoginAt`
- timestamps

### Token blacklist
Model: `BlacklistToken`

Purpose:
- Stores JWT tokens that have been invalidated after logout

Important fields:
- `token`
- `createdAt`

## 7. Authentication & Authorization

The project uses JWT-based authentication with cookie support and a blacklist mechanism for logout.

### Flow
1. A user registers via the relevant route.
2. The backend validates request input.
3. Passwords are hashed using `bcrypt` before saving.
4. The user logs in with email and password.
5. The server verifies the password and generates a JWT token.
6. The token is returned to the client and optionally stored in an HTTP-only cookie.
7. Protected routes use middleware to verify the JWT and token blacklist state.
8. The matching user record is loaded and attached to `req.user` or `req.customer` / `req.captain`.
9. Requests continue only if the token is valid and the user is authorized.
10. Logout adds the token to the blacklist and clears the cookie.

### Middleware used
- `authCustomer` - validates customer JWT
- `authShopOwner` - validates shop owner JWT
- `authCaptain` - validates captain JWT
- `authAnyUser` - validates a user and identifies whether they are a customer, shop owner, or captain
- `adminAuth` - validates admin JWT and checks admin status

### Role handling
The project currently implements role-specific middleware rather than a single global role system. The following flows are present in code:
- Customer routes protected by `authCustomer`
- Shop owner routes protected by `authShopOwner`
- Captain routes protected by `authCaptain`
- Notifications use `authAnyUser`
- Admin routes use `adminAuth`

## 8. API Endpoints

The project does not use an `/api` prefix. Routes are mounted directly on the base URLs shown below.

### Customer APIs

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/User/register` | Register a customer | No |
| POST | `/User/login` | Login a customer | No |
| GET | `/User/profile` | Get current customer profile | Yes |
| POST | `/User/logout` | Logout current customer | Yes |
| GET | `/User/location` | Get customer location | Yes |
| PATCH | `/User/location` | Update customer location | Yes |

### Shop Owner APIs

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/shop-owner/register` | Register a shop owner | No |
| POST | `/shop-owner/login` | Login a shop owner | No |
| GET | `/shop-owner/me` | Get shop owner profile | Yes |
| POST | `/shop-owner/logout` | Logout shop owner | Yes |
| GET | `/shop-owner/payment` | Get shop owner payment info | Yes |
| PATCH | `/shop-owner/payment` | Update payment details | Yes |

### Shop / Product APIs

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/shop-products` | Create a product | Yes (shop owner) |
| GET | `/shop-products/shop/:shopId` | Get products by shop | No |
| GET | `/shop-products/:productId` | Get one product | No |
| PUT | `/shop-products/:productId` | Update product | Yes (shop owner) |
| DELETE | `/shop-products/:productId` | Delete product | Yes (shop owner) |
| PATCH | `/shop-products/:productId/stock` | Update product stock | Yes (shop owner) |

### Cart APIs

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/cart` | Get current cart | Yes |
| POST | `/cart` | Add item to cart | Yes |
| PUT | `/cart/:productId` | Update cart item quantity | Yes |
| DELETE | `/cart/:productId` | Remove item from cart | Yes |
| DELETE | `/cart/clear` | Clear cart | Yes |

### Order APIs

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/orders` | Create an order | Yes (customer) |
| GET | `/orders` | Get customer orders | Yes (customer) |
| GET | `/orders/:orderId` | Get one customer order | Yes (customer) |
| PUT | `/orders/:orderId/cancel` | Cancel order | Yes (customer) |
| PATCH | `/orders/:orderId/payment/mark-paid` | Mark order as paid | Yes (customer) |
| GET | `/shop/:shopId/payment` | Get shop payment info for customer flow | Yes (customer) |
| GET | `/shop/orders` | Get shop order list | Yes (shop owner) |
| GET | `/shop/orders/:orderId` | Get one shop order | Yes (shop owner) |
| PUT | `/shop/orders/:orderId/accept` | Accept order | Yes (shop owner) |
| PUT | `/shop/orders/:orderId/status` | Update order status | Yes (shop owner) |
| PATCH | `/shop/orders/:orderId/payment/confirm` | Confirm payment | Yes (shop owner) |
| PATCH | `/shop/orders/:orderId/payment/confirm-cod` | Confirm COD payment | Yes (shop owner) |

### Captain APIs

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/captain/register` | Register a captain | No |
| POST | `/captain/login` | Login a captain | No |
| POST | `/captain/logout` | Logout a captain | Yes |
| GET | `/captain/profile` | Get captain profile | Yes |
| PUT | `/captain/profile` | Update captain profile | Yes |
| PUT | `/captain/change-password` | Change password | Yes |
| PATCH | `/captain/availability` | Update availability | Yes |
| GET | `/captain/location` | Get current captain location | Yes |
| PATCH | `/captain/location` | Update current captain location | Yes |
| GET | `/captain/deliveries/current` | Get current assigned delivery | Yes |
| PATCH | `/captain/deliveries/:orderId/arrived` | Confirm arrival at shop | Yes |
| PATCH | `/captain/deliveries/:orderId/pickup` | Confirm pickup | Yes |
| PATCH | `/captain/deliveries/:orderId/start` | Start delivery | Yes |
| PATCH | `/captain/deliveries/:orderId/payment/collect` | Collect delivery payment | Yes |
| PATCH | `/captain/deliveries/:orderId/complete` | Complete delivery | Yes |
| GET | `/captain/deliveries/history` | Get captain delivery history | Yes |

### Maps APIs

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/maps/captain-to-shop/:shopId` | Get captain-to-shop route information | Yes (captain) |
| GET | `/maps/captain-to-customer/:orderId` | Get captain-to-customer route information | Yes (captain) |
| GET | `/maps/shop-to-customer/:orderId` | Get shop-to-customer route information | Yes (shop owner) |

### Notification APIs

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/notifications/` | Get user notifications | Yes |
| GET | `/notifications/unread-count` | Get unread notification count | Yes |
| PATCH | `/notifications/:notificationId/read` | Mark one notification as read | Yes |
| PATCH | `/notifications/read-all` | Mark all notifications read | Yes |
| DELETE | `/notifications/:notificationId` | Delete one notification | Yes |
| DELETE | `/notifications/` | Delete all notifications for user | Yes |

### Assessment API

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/assessment/shops` | Assess nearby shops for customer flow | Yes (customer) |

### Admin APIs

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/admin/register` | Register admin | No |
| POST | `/admin/login` | Login admin | No |
| POST | `/admin/logout` | Logout admin | Yes |
| GET | `/admin/me` | Get admin profile | Yes |
| GET | `/admin/customers` | List customers | Yes |
| GET | `/admin/customers/:customerId` | Get one customer | Yes |
| PATCH | `/admin/customers/:customerId/activate` | Activate customer | Yes |
| PATCH | `/admin/customers/:customerId/deactivate` | Deactivate customer | Yes |
| GET | `/admin/shop-owners` | List shop owners | Yes |
| GET | `/admin/shop-owners/:ownerId` | Get one shop owner | Yes |
| PATCH | `/admin/shop-owners/:ownerId/approve` | Approve shop owner | Yes |
| PATCH | `/admin/shop-owners/:ownerId/reject` | Reject shop owner | Yes |
| PATCH | `/admin/shop-owners/:ownerId/suspend` | Suspend shop owner | Yes |
| GET | `/admin/shops` | List shops | Yes |
| GET | `/admin/shops/:shopId` | Get one shop | Yes |
| PATCH | `/admin/shops/:shopId/activate` | Activate shop | Yes |
| PATCH | `/admin/shops/:shopId/deactivate` | Deactivate shop | Yes |
| PATCH | `/admin/shops/:shopId/suspend` | Suspend shop | Yes |
| GET | `/admin/captains` | List captains | Yes |
| GET | `/admin/captains/:captainId` | Get one captain | Yes |
| PATCH | `/admin/captains/:captainId/approve` | Approve captain | Yes |
| PATCH | `/admin/captains/:captainId/reject` | Reject captain | Yes |
| PATCH | `/admin/captains/:captainId/suspend` | Suspend captain | Yes |
| GET | `/admin/orders` | List orders | Yes |
| GET | `/admin/orders/:orderId` | Get one order | Yes |
| GET | `/admin/dashboard` | Get admin dashboard stats | Yes |
| GET | `/admin/stats/orders` | Get order statistics | Yes |
| GET | `/admin/stats/sales` | Get sales statistics | Yes |
| GET | `/admin/stats/payments` | Get payment statistics | Yes |

### Sales APIs

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/sales/summary` | Summary sales metrics | Yes (shop owner) |
| GET | `/sales/statistics` | Sales statistics | Yes (shop owner) |
| GET | `/sales/trends` | Sales trend series | Yes (shop owner) |
| GET | `/sales/top-products` | Top-selling products | Yes (shop owner) |

## 9. Environment Variables

This project expects a local `.env` file in `Backend/`.

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_MAP_API=your_google_maps_api_key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

Notes:
- `MONGODB_URI` is required for database connection.
- `JWT_SECRET` is required for JWT signing and verification.
- `GOOGLE_MAP_API` is used by the Google Maps integration.
- `FRONTEND_URL` is used in Socket.IO configuration.
- `PORT` is not currently configured in `server.js`; the app listens on port `3000` by default.

> Never commit `.env` or expose secret keys in GitHub.

## 10. Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd Backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the `Backend` folder and add the required keys.

### 4. Start the backend
There are no custom npm scripts defined in the current `package.json`, so the backend is started directly with Node.js:

```bash
node server.js
```

The app will start on port `3000` unless changed in the code.

## 11. API Testing

The backend can be tested using Postman or any REST client.

### Recommended testing flow
1. Register a customer or shop owner
2. Log in to receive the JWT token and cookie
3. Access a protected route
4. Test role-specific endpoints
5. Log out and check that the token is rejected on subsequent requests

### Example order for testing
1. `/User/register`
2. `/User/login`
3. `/User/profile`
4. `/shop-products/shop/:shopId`
5. `/cart`
6. `/orders`
7. `/shop/orders` for shop owners
8. `/captain/register` and `/captain/login` for delivery flow
9. `/notifications`
10. `/admin/login` for admin flow

## 12. Error Handling

The backend currently uses standard Express and Mongoose error handling patterns.

Common patterns observed in code:
- `401 Unauthorized` for invalid or missing JWT tokens
- `403 Forbidden` for inactive or unauthorized account states
- `400 Bad Request` for invalid request input or validation failures
- `404 Not Found` when a resource does not exist
- `409 Conflict` for duplicate admin email registrations
- `500 Internal Server Error` for unexpected server-side failures

Validation is handled using Express Validator in some routes, and Mongoose schema validation is used for model-level validation.

## 13. Security

The project currently implements the following security practices:

- Password hashing using `bcrypt`
- JWT-based authentication
- HTTP-only cookies for session handling
- Blacklist token storage for logout invalidation
- Middleware-based route protection
- Environment variable configuration for secrets
- Validation checks on registration and login inputs

## 14. Current Architecture Flow

```text
Client
   ↓
Route
   ↓
Middleware
   ↓
Controller
   ↓
Service / Model
   ↓
MongoDB
   ↓
Response
```

This matches the current backend structure and request lifecycle observed in the codebase.

## 15. Development Roadmap

### Completed
- Customer authentication and profile flow
- Shop owner authentication and shop ownership flow
- Product management
- Cart management
- Order creation and lifecycle management
- Payment confirmation flows for UPI and COD
- Captain delivery flow
- Maps integration
- Notification service
- Sales analytics
- Admin dashboard and management APIs

### In Progress
- Real-time delivery/driver tracking integration is partially present through Socket.IO and related service files
- Some operational flows remain dependent on frontend usage and real deployment setup

### Planned
- Advanced financial analytics
- More detailed inventory monitoring and low-stock alerts
- Full customer product discovery experience
- Integration with external payment gateways
- More advanced delivery optimization and route intelligence
- Expanded admin reporting and business dashboards

## 16. Future Scope

The current project is a strong MVP backend for hyperlocal commerce. Future scope can include:

- Payment analytics and settlement summaries
- Profit and expense calculations
- Tax/GST calculations
- Financial forecasting
- Inventory forecasting
- Multi-vendor commission tools
- Subscription or wallet features
- Advanced order reporting

These are future modules and should not be confused with the current backend implementation.

## 17. Contribution / Development Guidelines

- Keep the codebase aligned with CommonJS module usage
- Prefer updating existing modules instead of rewriting working routes or controllers
- Keep routing, controllers, and services separate
- Validate authentication and authorization at middleware boundaries
- Use consistent naming patterns and model references
- Keep database logic in models and reusable logic in services
- Protect environment variables and do not expose secrets in GitHub

## 18. License

License information will be added later.

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