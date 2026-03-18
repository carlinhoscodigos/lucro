import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import accountsRoutes from './routes/accounts.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import budgetsRoutes from './routes/budgets.routes.js';
import goalsRoutes from './routes/goals.routes.js';
import recurringRoutes from './routes/recurring.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import reportsRoutes from './routes/reports.routes.js';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://lucro-theta.vercel.app',
    'https://lucro.onrender.com',
  ],
  credentials: true,
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API online');
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/auth', authRoutes);
app.use('/accounts', accountsRoutes);
app.use('/categories', categoriesRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/budgets', budgetsRoutes);
app.use('/goals', goalsRoutes);
app.use('/recurring-transactions', recurringRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/reports', reportsRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
