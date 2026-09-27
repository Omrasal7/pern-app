import { Router, Response } from 'express';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';

const router = Router();
router.use(authenticateToken);

// View inventory availability (Both Admin and Sales)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: { product: true }
    });

    const result = inventory.map(inv => ({
      id: inv.id,
      product_code: inv.product.product_code,
      product_name: inv.product.name,
      physical_quantity: inv.physical_quantity,
      reserved_quantity: inv.reserved_quantity,
      available_quantity: inv.physical_quantity - inv.reserved_quantity
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Update inventory (Admin only)
router.patch('/:productId', authorizeRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const { physical_quantity } = req.body;

  try {
    if (physical_quantity < 0) {
      return res.status(400).json({ error: 'Physical quantity cannot be negative' });
    }

    // We can't reduce physical quantity below reserved quantity
    const currentInv = await prisma.inventory.findUnique({ where: { product_id: Number(productId) } });
    if (!currentInv) {
      return res.status(404).json({ error: 'Inventory not found for product' });
    }

    if (physical_quantity < currentInv.reserved_quantity) {
      return res.status(400).json({ error: 'Physical quantity cannot be less than reserved quantity' });
    }

    const updated = await prisma.inventory.update({
      where: { product_id: Number(productId) },
      data: { physical_quantity }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

export default router;
