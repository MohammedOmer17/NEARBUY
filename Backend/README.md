# NearBuy Backend

NearBuy is a hyperlocal digital commerce platform connecting customers with nearby kirana and grocery shops and their existing inventory. Shops will manage their own products, prices, units, and stock; NearBuy does not maintain centralized inventory. This backend provides the foundation for authentication and shops, with products, orders, delivery partners, payments, and real-time tracking to be added as development progresses.

## Technology Stack

### In Use

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcrypt for password hashing
- Postman for manual API testing

### Planned Integrations

- Google Maps API for maps and location services
- Socket.IO for real-time updates
- Razorpay for payments
- ImageKit for image storage and delivery

These integrations are not implemented yet and are not current backend dependencies.

## Architecture

NearBuy is designed around three roles:

1. **Customer**: discovers nearby shops and, in future modules, browses products and places orders.
2. **Shop Owner**: authenticates and manages their account and associated shop. Shop-owner authentication and shop registration are implemented.
3. **Captain / Delivery Partner**: will fulfill delivery orders and share delivery progress when those modules are developed.

The current development focus is the Customer, ShopOwner, and Shop Mongoose models, plus ShopOwner registration, login, logout, and profile handling.

## Project Structure

Current files are shown as implemented. Items marked **planned** do not exist yet.

```text
Backend/
├── Controllers/
│   ├── CustomerController.js
│   ├── shopController.js
│   └── shopOwnerController.js
├── Middlewares/
│   └── authMiddleware.js
├── db/
│   └── db.js
├── models/
│   ├── CustomerModel.js
│   ├── ShopOwnerModel.js
│   ├── ShopModel.js
│   └── blackListTokenModel.js
├── routes/
│   ├── CustomerRoutes.js
│   └── shopOwnerRoutes.js
├── services/
│   └── CustomerService.js
├── .env                         # local configuration; do not commit secrets
├── app.js
├── server.js
├── package.json
└── README.md
```

**Planned, not present:** a Shop management routes file, a Postman collection, product/order/captain modules, and the planned external integrations.

> The repository currently has a few casing/style inconsistencies in directory and model filenames. On case-sensitive systems, import paths must match the actual filename casing.

## Models Developed

### Customer

The Customer authentication model is implemented in `models/CustomerModel.js` with:

- `name`, `email`, `phone`, and `password`
- `isVerified` and `isActive`
- Mongoose `createdAt` and `updatedAt` timestamps

Passwords are hashed with bcrypt in a Mongoose save hook. `comparePassword()` supports password verification, and `toJSON()` removes the password from serialized responses. The password field is also excluded from ordinary query results unless explicitly selected.

### ShopOwner

The ShopOwner authentication/account model is implemented in `models/ShopOwnerModel.js` with:

- `name`, `email`, `phone`, and `password`
- `isVerified`, `isActive`, and `accountStatus`
- Mongoose timestamps

`accountStatus` supports `pending`, `approved`, `suspended`, and `rejected`. Passwords are bcrypt-hashed, `comparePassword()` is available, and JSON serialization excludes the password.

ShopOwner stores authentication and account information only. It does not contain products, inventory, orders, shop location, or Captain information.

### Shop

The separate Shop model is implemented in `models/ShopModel.js` with:

- `owner`: required ObjectId reference to `ShopOwner`, with an index
- `shopName`, `address`, `contact`
- `location.latitude` and `location.longitude`
- `status`: `active`, `inactive`, or `suspended` (defaults to `active`)
- Mongoose timestamps

The relationship is:

```text
ShopOwner
    │
    │ owner reference
    ▼
Shop
```

The registration flow creates one Shop for a ShopOwner in the MVP. The `owner` index is not unique, so a one-to-one relationship is not enforced by a unique database constraint yet.

## ShopOwner Registration

Registration is implemented by the ShopOwner controller. Example request body (example values only):

```json
{
  "name": "Rahul Kumar",
  "email": "rahul@example.com",
  "phone": "9876543210",
  "password": "ExampleOnly@123",
  "shopName": "Rahul Kirana Store",
  "address": "Abids, Hyderabad",
  "latitude": 17.385,
  "longitude": 78.4867,
  "contact": "9876543210"
}
```

The flow validates required owner and shop fields, checks for duplicate email and phone, creates the ShopOwner, and then creates the Shop using the new owner's ID. Coordinates are stored under `location`. If Shop creation fails, the controller attempts to delete the newly created ShopOwner so an incomplete registration is not left behind. The response excludes the password. Registration does not issue a JWT.

## ShopOwner Authentication

### Login

Login accepts email and password, finds the ShopOwner, and verifies the password with `comparePassword()`. It rejects inactive, suspended, and rejected accounts, signs a JWT containing the ShopOwner ID, and stores it in an HTTP-only cookie. Safe ShopOwner information is returned without the password.

The current login logic permits an active account whose status is `pending`; approval is not currently required to log in.

### Logout

Logout clears the authentication cookie. When a token is available, it is also added to the token blacklist.

### Profile

The protected profile handler returns the authenticated ShopOwner and their associated Shop. The Shop lookup is scoped to the authenticated owner:

```js
Shop.findOne({ owner: req.user._id })
```

The ShopOwner password is excluded from the response.

## Routes

The route module defines these relative routes:

| Method | Route | Purpose | Authentication |
| --- | --- | --- | --- |
| `POST` | `/register` | Create a ShopOwner and associated Shop | Public |
| `POST` | `/login` | Authenticate a ShopOwner | Public |
| `POST` | `/logout` | Clear/revoke the current session token | Protected |
| `GET` | `/me` | Get the authenticated ShopOwner and Shop | Protected |

**Current mount:** `app.js` mounts `shopOwnerRoutes` at `/shop-owner`, so the URLs currently served are:

```text
POST /shop-owner/register
POST /shop-owner/login
POST /shop-owner/logout
GET  /shop-owner/me
```

The intended mount `/shop-owner/auth` has not been applied in the current `app.js`. After that mount is configured, the URLs will instead be:

```text
POST /shop-owner/auth/register
POST /shop-owner/auth/login
POST /shop-owner/auth/logout
GET  /shop-owner/auth/me
```

The current Shop management controller contains owner-scoped read/update/status handlers, but no Shop routes file is mounted yet; those handlers are not exposed as HTTP endpoints.

## Postman Testing

The authentication endpoints can be tested manually with Postman. There is no checked-in Postman collection at this stage. Postman is a testing tool, not a backend runtime dependency.

Suggested sequence:

```text
Register
   ↓
Approve account during development if required
   ↓
Login
   ↓
JWT cookie
   ↓
Get Profile
   ↓
Logout
```

The current login implementation permits active `pending` accounts, so approval is not required by the code at this time. Postman or the client must retain the cookie from login to call protected routes.

Useful cases to exercise:

- Successful registration
- Duplicate email
- Duplicate phone
- Successful login
- Invalid password
- Inactive account
- Suspended or rejected account
- Retrieve authenticated profile
- Logout and subsequent use of the revoked token
- Missing required registration or login fields

Use local example values only. Do not place production credentials or real secrets in requests, screenshots, or this README.

## Configuration and Running

`server.js` loads `Backend/.env` when present and connects to MongoDB before starting the HTTP server. Configure the following keys locally:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/nearbuy
JWT_SECRET=replace-with-a-local-development-secret
```

Do not commit real credentials. The project currently uses Node's built-in environment-file loader rather than the `dotenv` package.

Install dependencies and start the backend from this directory:

```bash
npm install
node server.js
```

## Security Practices

Implemented security measures include:

- bcrypt password hashing in Mongoose save middleware
- JWT authentication for ShopOwner sessions
- HTTP-only authentication cookie
- Password exclusion from serialized model/API responses
- Environment variables for the MongoDB URI and JWT secret
- Authentication middleware on protected ShopOwner routes
- Owner-scoped Shop lookup and update operations in the Shop controller
- Token blacklist support for logout

The cookie currently uses `sameSite: 'strict'` and enables `secure` in production. Deployments should review `secure`, `sameSite`, CORS, and HTTPS settings for their hosting and frontend origins.

## Development Status

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