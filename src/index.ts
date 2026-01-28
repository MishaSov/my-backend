import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173', // или порт вашего Vue приложения
  credentials: true
}));

// Middleware для JSON
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Проверка подключения к БД
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


// Тестовый API для Vue
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'success', 
    data: { message: 'API работает!' } 
  });
});


// Простой маршрут
app.get('/', (req, res) => {
  res.json({ 
    message: 'API сервер работает!',
    endpoints: [
      'GET /api/health - Проверка БД',
      'GET /api/test - Тестовый endpoint',
      'POST /api/auth/register - Регистрация',
      'POST /api/auth/login - Вход',
      'GET /api/users - Получить пользователей',
      'POST /api/users - Создать пользователя'
    ]
  });
});


// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Prisma disconnected');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL?.split('@')[1]}`);
  console.log(`📡 Доступные эндпоинты:`);
  console.log(`  POST http://localhost:${PORT}/api/auth/register`);
  console.log(`  POST http://localhost:${PORT}/api/auth/login`);
  console.log(`  GET  http://localhost:${PORT}/api/users`);
  console.log(`  POST http://localhost:${PORT}/api/users`);
});