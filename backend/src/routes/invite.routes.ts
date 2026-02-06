import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { InviteController } from '../controllers/invite.controller';

const router = Router();
const controller = new InviteController();

router.post('/', authMiddleware, (req, res) => controller.createInvite(req, res));
router.get('/:code', authMiddleware, (req, res) => controller.getInvite(req, res));
router.post('/:code/join', authMiddleware, (req, res) => controller.joinWithInvite(req, res));
router.delete('/:code', authMiddleware, (req, res) => controller.revokeInvite(req, res));

export default router;
