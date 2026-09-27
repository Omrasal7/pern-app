# 🏭 PERN ERP Mini Application

A clean, full-stack ERP web application built for a manufacturing and supply company using the **PERN stack** (PostgreSQL, Express.js, React.js, Node.js) with **Prisma ORM** and **TypeScript**.

---

## 📌 Complete Business Workflow

```mermaid
flowchart TD
    A["1. Customer Enquiry (Sales)"] --> B["2. Quotation (Sales)"]
    B --> C["3. Accept Quotation (Sales/Customer)"]
    C --> D["4. Convert to Sales Order (Sales)"]
    D --> E["5. Confirm Order & Reserve Stock (Admin)"]
    E --> F["6. Dispatch Order & Update Inventory (Admin)"]
```

1. **Customer Enquiry**: A customer asks for required products and quantities.
2. **Quotation**: Sales user creates a quotation against the enquiry with quantity, discount %, and GST %. The backend calculates the final line amounts and total.
3. **Quotation Acceptance**: Quotation status moves from `DRAFT` ➔ `SENT` ➔ `ACCEPTED`.
4. **Sales Order Creation**: Sales user converts the accepted quotation into a confirmed Sales Order. The system prevents duplicate order creation.
5. **Inventory Reservation**: Admin confirms the sales order. The system checks available stock (`physical_quantity - reserved_quantity`) and reserves the quantity atomically.
6. **Dispatch**: Admin dispatches the order with vehicle and driver details. Physical and reserved quantities are decremented together in a database transaction.

---

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), TypeScript, Pure CSS (custom responsive dark theme)
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL (v17)
- **ORM**: Prisma ORM (v7) with `@prisma/adapter-pg`
- **Authentication**: JSON Web Tokens (JWT) & bcrypt password hashing
- **Testing**: Jest & Supertest

---

## 🗄️ Database Design & ER Diagram

```mermaid
erDiagram
    User ||--o{ Enquiry : creates
    User ||--o{ Quotation : creates
    Customer ||--o{ Enquiry : places
    Customer ||--o{ SalesOrder : receives
    Enquiry ||--o{ EnquiryItem : contains
    Enquiry ||--o{ Quotation : generates
    Product ||--o{ EnquiryItem : referenced_in
    Product ||--o{ QuotationItem : referenced_in
    Product ||--o{ SalesOrderItem : referenced_in
    Product ||--o{ DispatchItem : referenced_in
    Product ||--|| Inventory : has
    Quotation ||--o{ QuotationItem : contains
    Quotation ||--o{ SalesOrder : converts_to
    SalesOrder ||--o{ SalesOrderItem : contains
    SalesOrder ||--o{ Dispatch : fulfills
    Dispatch ||--o{ DispatchItem : contains

    User {
        int id PK
        string name
        string email UK
        string password_hash
        string role
        datetime createdAt
    }

    Customer {
        int id PK
        string company_name
        string contact_person
        string mobile
        string email UK
        string city
    }

    Product {
        int id PK
        string product_code UK
        string name
        string category
        string unit
        float base_price
    }

    Inventory {
        int id PK
        int product_id FK
        int physical_quantity
        int reserved_quantity
    }
```

---

## 👥 User Roles & Permissions (RBAC)

Role authorization is enforced strictly on the backend:

| Capability | ADMIN | SALES |
|---|:---:|:---:|
| View Enquiries, Quotations & Sales Orders | ✅ | ✅ |
| View Live Inventory Availability | ✅ | ✅ |
| Create Customers & Enquiries | ✅ | ✅ |
| Create Quotations & Update Status | ❌ | ✅ |
| Convert Quotation to Sales Order | ❌ | ✅ |
| Confirm Sales Order (Reserve Inventory) | ✅ | ❌ |
| Dispatch Sales Order (Deduct Inventory) | ✅ | ❌ |

---

## 🔑 Test Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@example.com` | `admin123` |
| **Sales** | `sales@example.com` | `sales123` |

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
- Node.js (v18+ or v22+)
- PostgreSQL installed and running on port `5432`

### 2. Configure Backend Environment
Navigate to `backend/` and copy `.env.example` to `.env`:
```bash
cd backend
cp .env.example .env
```
Ensure your `.env` contains your PostgreSQL credentials:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/pern_erp?schema=public"
JWT_SECRET="supersecretkey"
```

### 3. Database Migration & Seeding
In the `backend/` folder:
```bash
# Run Prisma migrations to create all database tables
npx prisma migrate dev --name init

# Seed initial users, realistic industrial products, inventory & customer
npm run prisma:seed
```

### 4. Start the Application

Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# Server will start on http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# Frontend will start on http://localhost:5173
```

---

## 🧪 Running Automated Tests

The test suite covers calculation validation, state transitions, duplicate prevention, inventory limits, and RBAC:

```bash
cd backend
npm test
```

### Automated Tests Included:
1. **Quotation Calculation**: Validates `Quantity × Unit Price - Discount + GST = Total Amount`
2. **State Guard**: Ensures `DRAFT` or `REJECTED` quotations cannot be converted to Sales Orders.
3. **Duplicate Prevention**: Prevents duplicate Sales Orders from the same quotation.
4. **Inventory Concurrency Guard**: Rejects reservations if required quantity exceeds available inventory (`physical - reserved`).
5. **RBAC Guard**: Rejects restricted Admin operations when called by a Sales user (`HTTP 403`).

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/login` — Authenticates user with bcrypt and returns JWT token.

### Customers & Products
- `GET /api/customers` — Get customer list.
- `POST /api/customers` — Create a new customer (*Sales/Admin*).
- `GET /api/products` — Get product catalog.
- `POST /api/products` — Add a new product (*Admin*).

### Enquiries
- `GET /api/enquiries` — List all enquiries with customer and product details.
- `GET /api/enquiries/:id` — Get single enquiry details.
- `POST /api/enquiries` — Create a new enquiry with items (*Sales*).

### Quotations
- `GET /api/quotations` — List all quotations.
- `GET /api/quotations/:id` — Get single quotation details.
- `POST /api/quotations` — Create quotation with backend calculation validation (*Sales*).
- `PATCH /api/quotations/:id/status` — Update quotation status (`DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`).
- `POST /api/quotations/:id/convert` — Convert accepted quotation to Sales Order (*Sales*).

### Sales Orders & Inventory
- `GET /api/sales-orders` — List all sales orders.
- `POST /api/sales-orders/:id/confirm` — Confirm order and reserve inventory atomically (*Admin*).
- `POST /api/sales-orders/:id/dispatch` — Dispatch order and reduce physical/reserved inventory (*Admin*).
- `GET /api/inventory` — View inventory status with available quantity calculation.
