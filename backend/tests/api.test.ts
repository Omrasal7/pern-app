import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import quotationRoutes from '../src/routes/quotations';
import salesOrderRoutes from '../src/routes/salesOrders';
import jwt from 'jsonwebtoken';

// Setup Mock DB
jest.mock('../src/utils/db', () => {
  return {
    __esModule: true,
    default: {
      $transaction: jest.fn(),
      quotation: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      salesOrder: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      inventory: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      enquiry: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    },
  };
});

import prismaMock from '../src/utils/db';

const app = express();
app.use(express.json());
app.use('/api/quotations', quotationRoutes);
app.use('/api/sales-orders', salesOrderRoutes);

const tokenSales = jwt.sign({ userId: 1, role: 'SALES' }, 'secret');
const tokenAdmin = jwt.sign({ userId: 2, role: 'ADMIN' }, 'secret');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Automated Assessment Tests', () => {

  test('Test 1: Quotation total is calculated correctly (Quantity × Price - Discount + GST)', async () => {
    (prismaMock.$transaction as any).mockImplementation(async (callback: any) => {
      const tx = {
        product: {
          findMany: (jest.fn() as any).mockResolvedValue([
            { id: 1, base_price: 100 }
          ])
        },
        quotation: {
          create: jest.fn().mockImplementation((args: any) => {
            return {
              id: 1,
              ...args.data
            };
          })
        },
        enquiry: {
          update: jest.fn()
        }
      };
      return await callback(tx);
    });

    const payload = {
      quotation_number: 'Q-001',
      enquiry_id: 1,
      valid_until: '2026-10-01T00:00:00Z',
      items: [
        { product_id: 1, quantity: 2, discount_percent: 10, gst_percent: 18 }
      ]
    };

    const res = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${tokenSales}`)
      .send(payload);

    expect(res.status).toBe(201);
    // Calculation:
    // unit_price = 100, qty = 2 -> base = 200
    // discount 10% = 20 -> after discount = 180
    // gst 18% = 32.4 -> line_amount = 212.4
    const createdItem = res.body.items.create[0];
    expect(createdItem.line_amount).toBeCloseTo(212.4);
  });

  test('Test 2: Rejected/Draft quotation cannot create a Sales Order', async () => {
    (prismaMock.$transaction as any).mockImplementation(async (callback: any) => {
      const tx = {
        quotation: {
          findUnique: (jest.fn() as any).mockResolvedValue({
            id: 1, status: 'REJECTED', enquiry: { customer_id: 1 }
          })
        }
      };
      return await callback(tx);
    });

    const res = await request(app)
      .post('/api/quotations/1/convert')
      .set('Authorization', `Bearer ${tokenSales}`)
      .send({ order_number: 'SO-001' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Only ACCEPTED quotations can be converted');
  });

  test('Test 3: Same quotation cannot generate duplicate Sales Orders', async () => {
    (prismaMock.$transaction as any).mockImplementation(async (callback: any) => {
      const tx = {
        quotation: {
          findUnique: (jest.fn() as any).mockResolvedValue({
            id: 1, status: 'ACCEPTED', enquiry: { customer_id: 1 }, items: []
          })
        },
        salesOrder: {
          findFirst: (jest.fn() as any).mockResolvedValue({ id: 100 }) // Sales order already exists
        }
      };
      return await callback(tx);
    });

    const res = await request(app)
      .post('/api/quotations/1/convert')
      .set('Authorization', `Bearer ${tokenSales}`)
      .send({ order_number: 'SO-002' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Sales Order already exists for this quotation');
  });

  test('Test 4: Cannot reserve more than available inventory', async () => {
    (prismaMock.$transaction as any).mockImplementation(async (callback: any) => {
      const tx = {
        salesOrder: {
          findUnique: (jest.fn() as any).mockResolvedValue({
            id: 1, status: 'PENDING', items: [{ product_id: 1, quantity: 100 }]
          })
        },
        inventory: {
          updateMany: (jest.fn() as any).mockResolvedValue({ count: 0 }),
          findUnique: (jest.fn() as any).mockResolvedValue({ physical_quantity: 100, reserved_quantity: 50 }) // 50 available
        }
      };
      return await callback(tx);
    });

    const res = await request(app)
      .post('/api/sales-orders/1/confirm')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Insufficient inventory');
  });

  test('Test 5: Unauthorized user cannot perform a restricted operation', async () => {
    const res = await request(app)
      .post('/api/sales-orders/1/confirm')
      .set('Authorization', `Bearer ${tokenSales}`); // Sales user trying to do Admin action

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Unauthorized role');
  });

});
