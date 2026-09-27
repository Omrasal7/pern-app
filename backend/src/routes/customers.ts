import { Router, Response } from 'express';
import { authenticateToken, AuthRequest, authorizeRole } from '../middleware/auth';
import prisma from '../utils/db';

const router = Router();
router.use(authenticateToken);

// Get all customers
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const customers = await prisma.customer.findMany();
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Create customer (Sales User can create customers per requirements)
router.post('/', authorizeRole(['SALES', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const customer = await prisma.customer.create({
      data: req.body
    });
    res.status(201).json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

export default router;
