import { Router, Response } from 'express';
import { authenticateToken, AuthRequest, authorizeRole } from '../middleware/auth';
import prisma from '../utils/db';

const router = Router();
router.use(authenticateToken);

// Get all products
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create product (Admin)
router.post('/', authorizeRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.create({
      data: req.body
    });
    // Create empty inventory for new product
    await prisma.inventory.create({
      data: {
        product_id: product.id,
        physical_quantity: 0,
        reserved_quantity: 0
      }
    });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

export default router;
