import { Router } from 'express';
import { AccountController } from '../controllers/account.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new AccountController();

router.post('/', authMiddleware, (req, res) => controller.createAccount(req, res));
router.get('/my-accounts', authMiddleware, (req, res) => controller.getUserAccounts(req, res));
router.get('/:id', authMiddleware, (req, res) => controller.getAccount(req, res));
router.get('/:id/wallet-info', authMiddleware, (req, res) => controller.getAccountWalletInfo(req, res));
router.put('/:id/rules', authMiddleware, (req, res) => controller.updateRules(req, res));
router.post('/:id/signers', authMiddleware, (req, res) => controller.addSigner(req, res));
router.delete('/:id/signers/:signerId', authMiddleware, (req, res) => controller.removeSigner(req, res));
router.get('/:id/members', authMiddleware, (req, res) => controller.getMembers(req, res));
router.post('/:id/sync-multisig', authMiddleware, (req, res) => controller.syncMultisigConfig(req, res));

export default router;
