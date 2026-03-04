# ReverseShop Backend

Production-ready backend for the ReverseShop mobile application built with Node.js, Express, MongoDB, and TypeScript.

## Features Let alone

- **Clean Architecture:** Modular folder structure (controllers, models, routes, middleware, services).
- **TypeScript:** Fully typed with strict mode enabled.
- **Authentication:** JWT-based signup, login, logout, and token refresh system. Bcrypt password hashing.
- **Core Entities:** Users, Products, Wishlists, Carts, Orders, Reviews.
- **Security:** Helmet, CORS, Rate Limiting, request size limits, and robust data validation via `express-validator`.
- **Error Handling:** Centralized async error handling catching Mongoose errors and custom AppErrors without leaking stack traces in production.
- **Search System:** MongoDB $text full-text search capability.

## Prerequisites

- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB URI (e.g. MongoDB Atlas)

## Setup Instructions

1. **Install Dependencies:**

   ```bash
   npm install
   ```

2. **Configure Environment:**
   Copy the example environment file and update variables if necessary.

   ```bash
   cp .env.example .env
   ```

3. **Start Development Server:**

   ```bash
   npm run dev
   ```

4. **Production Build:**
   ```bash
   npm run build
   npm start
   ```

## Example API Requests

Base URL: `http://localhost:5000/api/v1`

### 1. Authentication

**Signup:**

```json
POST /auth/signup
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "supersecretpassword"
}
```

**Login:**

```json
POST /auth/login
{
  "email": "jane@example.com",
  "password": "supersecretpassword"
}
```

### 2. Products

**Get Products (with pagination, sort, filter):**

```
GET /products?page=1&limit=10&category=electronics&sort=newest
```

### 3. Cart & Checkout

**Add to Cart:**

```json
POST /cart/add
Headers: { "Authorization": "Bearer <accessToken>" }
{
  "productId": "64b5f8...",
  "quantity": 2
}
```

**Legacy Place Order:**

```json
POST /orders
Headers: { "Authorization": "Bearer <accessToken>" }
{
  "shippingAddress": "123 Main St, Tech City"
}
```

**Razorpay Checkout Flow:**

1. `POST /orders/checkout` with a shipping address. Server will create a DB order and a Razorpay order, returning the razorpay `orderId` plus the public key.
2. Invoke the Razorpay SDK on the client with the returned payload. After the user completes payment, call `POST /orders/verify` passing `orderId`, `razorpayPaymentId`, `razorpayOrderId`, and `razorpaySignature`.

Environment variables required for Razorpay integration (add to `.env`):

```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

### 4. Search

**Search Products:**

```
GET /search?q=laptop&category=electronics
```

## Scripts

- `npm run dev`: Start nodemon with ts-node
- `npm run build`: Compile TypeScript into `./dist`
- `npm start`: Start the production build
- `npm run type-check`: Run TS compiler without emitting (used for validation)
- `npm run lint`: Run ESLint over the `src` directory
- `npm run format`: Run Prettier to format source files
- `npm test`: Run Jest unit tests (coverage reports go to `coverage/`)

### Documentation

Interactive Swagger UI is available at `/api-docs` when `NODE_ENV` is not `production`. API annotations are generated from JSDoc comments in controllers.
