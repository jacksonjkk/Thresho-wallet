import { apiClient } from './api';

export interface MarketData {
    price: number;
    change24h: number;
}

export const marketService = {
    async getXLMPrice(): Promise<MarketData> {
        try {
            return await apiClient.get<MarketData>('/market/price');
        } catch (err) {
            console.error('Failed to fetch XLM price:', err);
            return { price: 0, change24h: 0 };
        }
    }
};
