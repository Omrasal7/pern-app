# API Documentation

## Authentication
### `POST /api/auth/login`
- **Request Body**: `{ "email": "admin@example.com", "password": "password123" }`
- **Response**: `{ "token": "jwt-token-string", "role": "ADMIN", "name": "Admin User" }`

## Enquiries
### `GET /api/enquiries`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: List of all enquiries.

### `POST /api/enquiries`
- **Roles**: SALES
- **Request Body**:
```json
{
  "enquiry_number": "ENQ-100",
  "customer_id": 1,
  "required_date": "2026-10-01",
  "notes": "Urgent requirement",
  "items": [
    { "product_id": 1, "quantity": 100 }
  ]
}
```

## Quotations
### `POST /api/quotations`
- **Roles**: SALES
- **Request Body**:
```json
{
  "quotation_number": "QT-100",
  "enquiry_id": 1,
  "valid_until": "2026-10-15",
  "items": [
    { "product_id": 1, "quantity": 100, "discount_percent": 10, "gst_percent": 18 }
  ]
}
```

### `PATCH /api/quotations/:id/status`
- **Roles**: SALES
- **Request Body**: `{ "status": "ACCEPTED" }`

### `POST /api/quotations/:id/convert`
- **Roles**: SALES
- **Description**: Converts ACCEPTED quotation into a Sales Order.
- **Request Body**: `{ "order_number": "SO-100" }`

## Sales Orders
### `GET /api/sales-orders`
- **Headers**: `Authorization: Bearer <token>`

### `POST /api/sales-orders/:id/confirm`
- **Roles**: ADMIN
- **Description**: Reserves inventory for the order.

### `POST /api/sales-orders/:id/dispatch`
- **Roles**: ADMIN
- **Description**: Creates dispatch record and decreases inventory.
- **Request Body**:
```json
{
  "dispatch_number": "DSP-100",
  "vehicle_number": "KA-01-1234",
  "driver_name": "Raju"
}
```

## Inventory
### `GET /api/inventory`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of inventory objects with `physical_quantity`, `reserved_quantity`, and calculated `available_quantity`.
