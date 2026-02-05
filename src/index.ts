import express, { NextFunction, Request, Response, response } from 'express';
import config from 'config'
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import validateEnv from './utils/validateEnv';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import userRouter from './routes/user.routes';
import authRouter from './routes/auth.routes';
import AppError from './utils/appError';
import redisClient from './utils/connectRedis';
import nodemailer from 'nodemailer';
// (async function () {
//   console.log('работает');
  
//   const credentials = await nodemailer.createTestAccount();
//   console.log('данные smpy ', credentials);
// })();


dotenv.config();

validateEnv();

const prisma = new PrismaClient();
const app = express();


async function bootstrap() {
  // Testing
  app.get('/api/healthchecker', async (_, res: Response) => {
    const message = await redisClient.get('try');
    res.status(200).json({
      status: 'success',
      message,
    });
  });

  // TEMPLATE ENGINE
  app.set('view engine', 'pug');
  app.set('views', `${__dirname}/views`);

  // MIDDLEWARE

  // 1.Body Parser
  app.use(express.json({ limit: '10kb' }));

  // 2. Cookie Parser
  app.use(cookieParser());

  // 2. Cors
  app.use(
    cors({
      origin: [config.get<string>('origin')],
      credentials: true,
    })
  );

  // 3. Logger
  if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

  // ROUTES
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);

  // Testing
  app.get('/api/healthchecker', (_, res: Response) => {
    res.status(200).json({
      status: 'success',
      message: 'Welcome to NodeJs with Prisma and PostgreSQL',
    });
  });

    // UNHANDLED ROUTES (path-to-regexp v7+ requires a named wildcard, e.g. *path)
    app.all('*path', (req: Request, res: Response, next: NextFunction) => {
      next(new AppError(404, `Route ${req.originalUrl} not found`));
    });

  // GLOBAL ERROR HANDLER
  app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
    err.status = err.status || 'error';
    err.statusCode = err.statusCode || 500;

    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  });

  const port = config.get<number>('port');
  app.listen(port, () => {
    console.log(`Server on port: ${port}`);
  });
}

bootstrap()
  .catch((err) => {
    throw err;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// // Проверка подключения к БД
// app.get('/api/health', async (req, res) => {
//   try {
//     await prisma.$queryRaw`SELECT 1`;
//     res.json({
//       status: 'ok',
//       database: 'connected',
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       database: 'disconnected',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// });


// // Тестовый API для Vue
// app.get('/api/test', (req, res) => {
//   res.json({
//     status: 'success',
//     data: { message: 'API работает!' }
//   });
// });
