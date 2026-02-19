import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { TransactionController } from '../controllers/transaction.controller';

const router = Router();
const controller = new TransactionController();

router.post('/', authMiddleware, (req, res) => controller.createTransaction(req, res));
router.get('/', authMiddleware, (req, res) => controller.listTransactions(req, res));
router.get('/on-chain', authMiddleware, (req, res) => controller.getOnChainHistory(req, res));
router.get('/:id', authMiddleware, (req, res) => controller.getTransaction(req, res));
router.post('/:id/sign', authMiddleware, (req, res) => controller.signTransaction(req, res));

router.post('/:id/reject', authMiddleware, (req, res) => controller.rejectTransaction(req, res));
router.post('/:id/execute', authMiddleware, (req, res) => controller.executeTransaction(req, res));
router.delete('/:id', authMiddleware, (req, res) => controller.deleteTransaction(req, res));

export default router;
