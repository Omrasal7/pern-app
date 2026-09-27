import { Router, Response } from 'express';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const enquiries = await prisma.enquiry.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        enquiry_date: 'desc'
      }
    });
    res.json(enquiries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

// Get single enquiry by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    });
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });
    res.json(enquiry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch enquiry' });
  }
});

router.post('/', authorizeRole(['SALES']), async (req: AuthRequest, res: Response) => {
  const { enquiry_number, customer_id, required_date, notes, items } = req.body;
  const created_by = req.user!.userId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const enquiry = await tx.enquiry.create({
        data: {
          enquiry_number,
          customer_id,
          required_date: new Date(required_date),
          notes,
          created_by,
          items: {
            create: items.map((item: any) => ({
              product_id: item.product_id,
              quantity: item.quantity
            }))
          }
        },
        include: { items: true, customer: true }
      });
      return enquiry;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create enquiry' });
  }
});

export default router;
