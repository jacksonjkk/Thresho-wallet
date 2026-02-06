import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new AuthController();

router.post('/check-email', (req, res) => controller.checkEmailExists(req, res));
router.post('/register', (req, res) => controller.register(req, res));
router.post('/login', (req, res) => controller.login(req, res));
router.post('/challenge', (req, res) => controller.getChallenge(req, res));
router.post('/verify-challenge', (req, res) => controller.verifyChallenge(req, res));
router.get('/me', authMiddleware, (req, res) => controller.getProfile(req, res));
router.get('/wallet', authMiddleware, (req, res) => controller.getWalletInfo(req, res));
router.put('/me', authMiddleware, (req, res) => controller.updateProfile(req, res));
router.post('/complete-onboarding', authMiddleware, (req, res) => controller.completeOnboarding(req, res));

export default router;
