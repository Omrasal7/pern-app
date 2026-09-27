import { Router, Response } from 'express';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';

const router = Router();
router.use(authenticateToken);

// Get sales orders
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      include: {
        customer: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: { order_date: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch sales orders' });
  }
});

// Confirm Sales Order (Reserves Inventory)
router.post('/:id/confirm', authorizeRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: Number(id) },
        include: { items: true }
      });

      if (!order) throw new Error('Sales Order not found');
      if (order.status !== 'PENDING') throw new Error('Only PENDING orders can be confirmed');

      // Check and reserve inventory
      for (const item of order.items) {
        // We use updateMany for atomic check & update to prevent concurrency issues
        const updateResult = await tx.inventory.updateMany({
          where: {
            product_id: item.product_id,
            // physical - reserved >= quantity
            physical_quantity: { gte: item.quantity },
          },
          data: {
            reserved_quantity: { increment: item.quantity }
          }
        });

        if (updateResult.count === 0) {
          // If 0 records updated, it means either inventory doesn't exist or not enough available
          // Let's check which one it is
          const inv = await tx.inventory.findUnique({ where: { product_id: item.product_id } });
          if (!inv) throw new Error(`Inventory for product ${item.product_id} not found`);
          const available = inv.physical_quantity - inv.reserved_quantity;
          if (available < item.quantity) {
            throw new Error(`Insufficient inventory for product ${item.product_id}. Available: ${available}, Required: ${item.quantity}`);
          }
        }
      }

      const confirmedOrder = await tx.salesOrder.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' }
      });

      return confirmedOrder;
    });

    res.json(result);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Failed to confirm sales order' });
  }
});

// Dispatch Sales Order
router.post('/:id/dispatch', authorizeRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { dispatch_number, vehicle_number, driver_name } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: Number(id) },
        include: { items: true }
      });

      if (!order) throw new Error('Sales Order not found');
      if (order.status !== 'CONFIRMED') throw new Error('Only CONFIRMED orders can be dispatched');

      // Decrease physical and reserved quantities
      for (const item of order.items) {
        const updateResult = await tx.inventory.updateMany({
          where: {
            product_id: item.product_id,
            reserved_quantity: { gte: item.quantity },
          },
          data: {
            physical_quantity: { decrement: item.quantity },
            reserved_quantity: { decrement: item.quantity }
          }
        });

        if (updateResult.count === 0) {
          throw new Error(`Cannot dispatch beyond reserved quantity for product ${item.product_id}`);
        }
      }

      // Create dispatch record
      const dispatch = await tx.dispatch.create({
        data: {
          dispatch_number,
          sales_order_id: order.id,
          vehicle_number,
          driver_name,
          items: {
            create: order.items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity
            }))
          }
        }
      });

      const dispatchedOrder = await tx.salesOrder.update({
        where: { id: order.id },
        data: { status: 'DISPATCHED' }
      });

      return dispatch;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Failed to dispatch sales order' });
  }
});

export default router;
