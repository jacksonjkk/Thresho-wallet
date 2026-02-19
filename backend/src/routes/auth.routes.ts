import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();
const controller = new AuthController();

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
});

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
});

router.post('/check-email', loginLimiter, (req, res) => controller.checkEmailExists(req, res));
router.post('/register', loginLimiter, (req, res) => controller.register(req, res));
router.post('/login', loginLimiter, (req, res) => controller.login(req, res));
router.post('/challenge', authLimiter, (req, res) => controller.getChallenge(req, res));
router.post('/verify-challenge', authLimiter, (req, res) => controller.verifyChallenge(req, res));
router.get('/me', authMiddleware, (req, res) => controller.getProfile(req, res));
router.get('/wallet', authMiddleware, (req, res) => controller.getWalletInfo(req, res));
router.put('/me', authMiddleware, (req, res) => controller.updateProfile(req, res));
router.post('/complete-onboarding', authMiddleware, (req, res) => controller.completeOnboarding(req, res));
router.post('/logout', (req, res) => controller.logout(req, res));

// Delete account endpoint
router.delete('/me', authMiddleware, (req, res) => controller.deleteAccount(req, res));

export default router;
