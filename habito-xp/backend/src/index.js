import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://lucro-theta.vercel.app',
  ],
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API online');
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
