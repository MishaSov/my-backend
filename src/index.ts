import express, { NextFunction, Request, Response } from 'express';
import config from 'config'
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import validateEnv from './utils/validateEnv';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import userRouter from './routes/user.routes';
import authRouter from './routes/auth.routes';
import postRouter from './routes/post.routes';
import AppError from './utils/appError';
import redisClient from './utils/connectRedis';
dotenv.config();

validateEnv();

const prisma = new PrismaClient();
const app = express();


async function bootstrap() {
  // TEMPLATE ENGINE
  app.set('view engine', 'pug');
  app.set('views', `${__dirname}/views`);

  // MIDDLEWARE
   app.use('/api/static', express.static(path.join(__dirname, '../public')));

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
  app.use('/api/posts', postRouter);

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

