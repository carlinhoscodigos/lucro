require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://teu-frontend.vercel.app"
  ]
}));

app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("select now()");
    res.json({ ok: true, db: result.rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});