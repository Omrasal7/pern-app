import { Router, Response } from 'express';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { Prisma } from '@prisma/client';

const router = Router();
router.use(authenticateToken);

// Get all quotations (both roles can view)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: {
        enquiry: {
          include: { customer: true }
        },
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(quotations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

// Get a single quotation by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        enquiry: { include: { customer: true } },
        items: { include: { product: true } }
      }
    });
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
    res.json(quotation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch quotation' });
  }
});

// Create quotation
router.post('/', authorizeRole(['SALES']), async (req: AuthRequest, res: Response) => {
  const { quotation_number, enquiry_id, valid_until, items } = req.body;
  const created_by = req.user!.userId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get base prices from products to avoid trusting frontend
      const productIds = items.map((i: any) => i.product_id);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } }
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      const quotationItems = items.map((item: any) => {
        const product = productMap.get(item.product_id);
        if (!product) throw new Error(`Product ${item.product_id} not found`);

        const unit_price = Number(product.base_price);
        const quantity = Number(item.quantity);
        const discount_percent = Number(item.discount_percent || 0);
        const gst_percent = Number(item.gst_percent || 0);

        const base_amount = quantity * unit_price;
        const discount_amount = base_amount * (discount_percent / 100);
        const amount_after_discount = base_amount - discount_amount;
        const gst_amount = amount_after_discount * (gst_percent / 100);
        const line_amount = amount_after_discount + gst_amount;

        return {
          product_id: item.product_id,
          quantity,
          unit_price,
          discount_percent,
          gst_percent,
          line_amount
        };
      });

      const quotation = await tx.quotation.create({
        data: {
          quotation_number,
          enquiry_id,
          valid_until: new Date(valid_until),
          status: 'DRAFT',
          created_by,
          items: {
            create: quotationItems
          }
        },
        include: { items: true }
      });

      await tx.enquiry.update({
        where: { id: enquiry_id },
        data: { status: 'QUOTED' }
      });

      return quotation;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Failed to create quotation' });
  }
});

// Update status (e.g. DRAFT -> SENT -> ACCEPTED / REJECTED)
router.patch('/:id/status', authorizeRole(['SALES']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updated = await prisma.quotation.update({
      where: { id: Number(id) },
      data: { status }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update quotation status' });
  }
});

// Convert to Sales Order
router.post('/:id/convert', authorizeRole(['SALES']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { order_number } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({
        where: { id: Number(id) },
        include: { items: true, enquiry: true }
      });

      if (!quotation) throw new Error('Quotation not found');
      if (quotation.status !== 'ACCEPTED') throw new Error('Only ACCEPTED quotations can be converted');

      // Check for existing sales order to prevent duplicates
      const existingOrder = await tx.salesOrder.findFirst({
        where: { quotation_id: quotation.id }
      });
      if (existingOrder) throw new Error('Sales Order already exists for this quotation');

      const total_amount = quotation.items.reduce((sum, item) => sum + Number(item.line_amount), 0);

      const salesOrder = await tx.salesOrder.create({
        data: {
          order_number,
          customer_id: quotation.enquiry.customer_id,
          quotation_id: quotation.id,
          total_amount,
          items: {
            create: quotation.items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity
            }))
          }
        },
        include: { items: true }
      });

      // Update enquiry status to WON
      await tx.enquiry.update({
        where: { id: quotation.enquiry_id },
        data: { status: 'WON' }
      });

      return salesOrder;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Failed to convert quotation' });
  }
});

export default router;
