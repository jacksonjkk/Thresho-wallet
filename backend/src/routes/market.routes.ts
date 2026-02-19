import { Router } from 'express';
import { MarketController } from '../controllers/market.controller';

const router = Router();
const marketController = new MarketController();

// Public route - anyone can see the price
router.get('/price', marketController.getXLMPrice.bind(marketController));

export default router;
