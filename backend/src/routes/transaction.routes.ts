import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, (req, res) => {
  res.json({ message: 'Create transaction endpoint' });
});

router.get('/:id', authMiddleware, (req, res) => {
  res.json({ message: 'Get transaction endpoint' });
});

router.post('/:id/sign', authMiddleware, (req, res) => {
  res.json({ message: 'Sign transaction endpoint' });
});

router.post('/:id/execute', authMiddleware, (req, res) => {
  res.json({ message: 'Execute transaction endpoint' });
});

export default router;
