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

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://lucro-theta.vercel.app',
]);

const corsOptions = {
  origin(origin, callback) {
    // Permite requests server-to-server / curl (sem origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`CORS bloqueado para origem: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false, // usamos Bearer token (não cookies)
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
