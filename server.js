require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(express.static('public'));

// Создаём таблицу если не существует
pool.query(`
  CREATE TABLE IF NOT EXISTS responses (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    time TIME NOT NULL,
    food TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).then(() => console.log('Таблица готова'))
  .catch(err => console.error('Ошибка создания таблицы:', err));

// Сохранить ответ
app.post('/api/response', async (req, res) => {
  const { date, time, food } = req.body;

  // Валидация на бэке
  if (!date || !time || !food) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    await pool.query(
      'INSERT INTO responses (date, time, food) VALUES ($1, $2, $3)',
      [date, time, food]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Посмотреть все ответы
app.get('/api/responses', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM responses ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
