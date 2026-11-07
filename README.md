# 🛒 ShopVerse — E-Commerce Platform (MySQL on Aiven)

ShopVerse is a modern full-stack e-commerce web application inspired by **Amazon's shopping architecture** and **Fastrack's bold fashion/accessory styling**.

It uses **MySQL hosted on Aiven Cloud** as the primary relational database for all application data, with a clean decoupled architecture ready for containerization and AWS DevOps deployment.

---

## 🏗️ Architecture Overview

```
                          ┌─────────────────────────────┐
                          │   React 18 + Vite Frontend   │
                          │   (Tailwind CSS + Lucide/Hi) │
                          └──────────────┬──────────────┘
                                         │  REST API (Axios + JWT)
                                         ▼
                          ┌─────────────────────────────┐
                          │      Flask REST Backend     │
                          │   (SQLAlchemy ScopedSession)│
                          └──────────────┬──────────────┘
                                         │
                                         ▼
                         ┌───────────────────────────────┐
                         │      Aiven Cloud MySQL        │
                         ├───────────────────────────────┤
                         │ • Users & Authentication      │
                         │ • Addresses & Profiles        │
                         │ • Categories & Products       │
                         │ • Product Variants & Stock    │
                         │ • Carts & Cart Items          │
                         │ • Wishlists                   │
                         │ • Orders & Order Items        │
                         │ • Payment Transactions        │
                         │ • Shipment Tracking           │
                         │ • Product Reviews & Ratings   │
                         │ • Returns & Refund Requests   │
                         └───────────────────────────────┘
```

---

## ✨ Implemented Features

1. **Product Listing Page** (`/products`):
   - Responsive grid with prices, MRP discounts, brand names, and star ratings.
   - Dynamic pagination and real-time category filtering.

2. **Product Details Page** (`/products/:id`):
   - Multi-image gallery with active thumbnail switcher.
   - In-stock availability check and quantity selector.
   - Comprehensive customer reviews section with verified badges.

3. **Product Categories & Search**:
   - Multi-field search across title, brand, and description.
   - Category filtering (Electronics, Watches, Sunglasses, Bags, Shoes, Clothing).
   - Price range filters (Min/Max) and sorting (Newest, Price Low-High, Price High-Low, Alphabetical).

4. **Add to Cart & Update Quantity**:
   - Persistent database-backed shopping cart (`carts` and `cart_items` tables in MySQL).
   - Real-time quantity increment/decrement with subtotal calculation.

5. **Remove Products from Cart**:
   - Remove individual items or clear the entire cart.

6. **Checkout & Order Creation**:
   - Full shipping & billing address form.
   - Atomic ACID checkout in MySQL: verifies inventory, creates order, deducts stock, clears cart, logs payment transaction, and initializes shipment tracking.
   - Payment security: Stores gateway transaction references and status only — never raw card numbers or CVVs.

7. **Order History for Logged-In Users** (`/orders` & `/orders/:id`):
   - Detailed list of past orders with status badges (`confirmed`, `shipped`, `delivered`, `cancelled`).
   - Order detail page with item snapshots, totals, payment details, and shipment timeline events.
   - Customer-initiated order cancellation with automatic stock restoration.

8. **Product Reviews & Ratings**:
   - 1-to-5 star rating submission with review title and body.
   - One review per user per product constraint (`uq_review_product_user`).
   - Real-time rating aggregation (average rating and review count) calculated directly in MySQL.

9. **Admin Product Management** (`/admin/products` & `/admin`):
   - Complete product catalog management: Add, Edit, and Soft Delete products.
   - Inventory stock level adjustments.
   - Order status management (`confirmed` → `shipped` → `delivered`).
   - Interactive Admin Dashboard with total revenue, customer count, low-stock warnings, and order counts.

10. **Product Image Upload & Amazon S3 Preparation**:
    - Pluggable storage architecture (`app/services/storage_service.py`):
      - **Local Storage** (`LocalStorageService`): Saves uploaded images to `backend/uploads/products/` and serves via `/media/uploads/<filename>`.
      - **Amazon S3** (`S3StorageService`): Fully prepared for production DevOps deployment. Set `STORAGE_BACKEND=s3` and provide AWS credentials in `.env` (never exposed to frontend code).
    - Image file upload in Admin with instant thumbnail preview and support for custom external URLs.

---

## ⚡ Quick Start Guide

### 1. Database Configuration (`backend/.env`)

Ensure your `backend/.env` has your active Aiven Cloud MySQL credentials:

```ini
SECRET_KEY=shopverse-super-secret-key-change-in-production
JWT_EXPIRATION_HOURS=24
FLASK_DEBUG=true

# Aiven MySQL Connection
MYSQL_HOST=mysql-db-your-instance.aivencloud.com
MYSQL_PORT=10875
MYSQL_DATABASE=defaultdb
MYSQL_USER=avnadmin
MYSQL_PASSWORD=your-mysql-password
MYSQL_SSL_MODE=REQUIRED

# Storage Configuration
STORAGE_BACKEND=local
```

### 2. Run the Backend

```bash
cd backend

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/WSL:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Seed MySQL database (creates tables & initial products)
python -m app.seed

# Start Flask backend (port 5000)
python run.py
```

### 3. Run the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (port 3000)
npm run dev
```

Visit **http://localhost:3000** in your browser.

---

## 👥 Default Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@shopverse.com` | `Admin@123` |
| **Customer** | `customer@test.com` | `Test@123` |
