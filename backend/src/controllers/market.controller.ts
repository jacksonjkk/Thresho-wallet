import { Request, Response } from 'express';

export class MarketController {
    async getXLMPrice(req: Request, res: Response) {
        try {
            console.log('Fetching XLM price from CoinGecko...');
            const response = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd&include_24hr_change=true',
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Thresho-Wallet-App/1.0'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`CoinGecko API returned ${response.status}`);
            }

            const data = await response.json() as any;

            return res.json({
                price: data.stellar.usd,
                change24h: data.stellar.usd_24h_change
            });
        } catch (err) {
            console.error('Failed to fetch XLM price from backend:', err);
            // Fallback data if API is down
            return res.status(503).json({
                error: 'Market data currently unavailable',
                price: 0,
                change24h: 0
            });
        }
    }
}
