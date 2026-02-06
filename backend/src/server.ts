import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import authRoutes from './routes/auth.routes';
import accountRoutes from './routes/account.routes';
import transactionRoutes from './routes/transaction.routes';
import inviteRoutes from './routes/invite.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ 
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean)
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/invites', inviteRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

export default app;
