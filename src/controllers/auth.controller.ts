import crypto from 'crypto';
import { CookieOptions, NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { LoginUserInput, RegisterUserInput } from '../schemas/user.schema';
import {
  createUser,
  findUniqueUser,
  signTokens,
} from '../services/user.service';
import { Prisma } from '@prisma/client';
import config from 'config';
import AppError from '../utils/appError';
import redisClient from '../utils/connectRedis';
import { signJwt, verifyJwt } from '../utils/jwt';

// ? Cookie Options Here

const cookiesOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
};

if (process.env.NODE_ENV === 'production') cookiesOptions.secure = true;

const accessTokenCookieOptions: CookieOptions = {
  ...cookiesOptions,
  expires: new Date(
    Date.now() + config.get<number>('accessTokenExpiresIn') * 60 * 1000
  ),
  maxAge: config.get<number>('accessTokenExpiresIn') * 60 * 1000,
};

const refreshTokenCookieOptions: CookieOptions = {
  ...cookiesOptions,
  expires: new Date(
    Date.now() + config.get<number>('refreshTokenExpiresIn') * 60 * 1000
  ),
  maxAge: config.get<number>('refreshTokenExpiresIn') * 60 * 1000,
};

export const registerUserHandler = async (
  req: Request<{}, {}, RegisterUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    const verifyCode = crypto.randomBytes(32).toString('hex');
    const verificationCode = crypto
      .createHash('sha256')
      .update(verifyCode)
      .digest('hex');

    const user = await createUser({
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      password: hashedPassword,
      verificationCode,
    });

    res.status(201).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          status: 'fail',
          message: 'Email already exist, please use another email address',
        });
      }
    }
    next(err);
  }
};

export const loginUserHandler = async (
  req: Request<{}, {}, LoginUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await findUniqueUser(
      { email: email.toLowerCase() },
      { id: true, email: true, verified: true, password: true }
    );

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new AppError(400, 'Invalid email or password'));
    }

    // Sign Tokens
    const { access_token, refresh_token } = await signTokens(user);
    res.cookie('access_token', access_token, accessTokenCookieOptions);
    res.cookie('refresh_token', refresh_token, refreshTokenCookieOptions);
    res.cookie('logged_in', true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    res.status(200).json({
      status: 'success',
      access_token,
    });
  } catch (err: any) {
    next(err);
  }
};

export const refreshAccessTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    const message = 'Could not refresh access token';

    if (!refresh_token) {
      return next(new AppError(403, message));
    }

    // Validate refresh token
    const decoded = verifyJwt<{ sub: string }>(
      refresh_token,
      'refreshTokenPublicKey'
    );

    if (!decoded) {
      return next(new AppError(403, message));
    }

    // Check if user has a valid session
    const session = await redisClient.get(decoded.sub);

    if (!session) {
      return next(new AppError(403, message));
    }

    // Check if user still exist
    const user = await findUniqueUser({ id: JSON.parse(session).id });

    if (!user) {
      return next(new AppError(403, message));
    }

    // Sign new access token
    const access_token = signJwt({ sub: user.id }, 'accessTokenPrivateKey', {
      expiresIn: `${config.get<number>('accessTokenExpiresIn')}m`,
    });

    // 4. Add Cookies
    res.cookie('access_token', access_token, accessTokenCookieOptions);
    res.cookie('logged_in', true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    // 5. Send response
    res.status(200).json({
      status: 'success',
      access_token,
    });
  } catch (err: any) {
    next(err);
  }
};

function logout(res: Response) {
  res.cookie('access_token', '', { maxAge: -1 });
  res.cookie('refresh_token', '', { maxAge: -1 });
  res.cookie('logged_in', '', { maxAge: -1 });
}

export const logoutUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await redisClient.del(res.locals.user.id);
    logout(res);

    res.status(200).json({
      status: 'success',
    });
  } catch (err: any) {
    next(err);
  }
};

// import { Request, Response } from 'express';
// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';
// import prisma from '../lib/prisma';

// const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// export const register = async (req: Request, res: Response) => {
//   try {
//     const { email, name, password } = req.body;

//     // Валидация
//     if (!email || !password || !name) {
//       return res.status(400).json({
//         error: 'Email, name and password are required'
//       });
//     }

//     // Валидация email
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ error: 'Invalid email format' });
//     }

//     // Проверка длины пароля
//     if (password.length < 6) {
//       return res.status(400).json({ error: 'Password must be at least 6 characters' });
//     }

//     // Проверка существующего пользователя
//     const existingUser = await prisma.user.findUnique({
//       where: { email }
//     });

//     if (existingUser) {
//       return res.status(400).json({ error: 'User already exists' });
//     }

//     // Хэширование пароля
//     const hashedPassword = await bcrypt.hash(password, 12);

//     // Создание пользователя
//     const user = await prisma.user.create({
//       data: {
//         email,
//         name,
//         password: hashedPassword,
//         role: 'USER' // Указываем роль по умолчанию
//       },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         role: true,
//         createdAt: true,
//         updatedAt: true
//       }
//     });

//     // Генерация JWT токена
//     const token = jwt.sign(
//       { userId: user.id, email: user.email, role: user.role },
//       JWT_SECRET,
//       { expiresIn: '5m' }
//     );

//     res.status(201).json({
//       user,
//       token,
//       message: 'Registration successful'
//     });
//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

// export const login = async (req: Request, res: Response) => {
//   try {
//     const { email, password } = req.body;

//     // Найти пользователя
//     const user = await prisma.user.findUnique({
//       where: { email }
//     });

//     if (!user) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // Проверить пароль
//     const isValidPassword = await bcrypt.compare(password, user.password);

//     if (!isValidPassword) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // Генерация токена
//     const token = jwt.sign(
//       { userId: user.id, email: user.email, role: user.role },
//       JWT_SECRET,
//       { expiresIn: '5m' }
//     );

//     // Не возвращаем пароль в ответе
//     const { password: _, ...userWithoutPassword } = user;

//     res.json({
//       user: userWithoutPassword,
//       token,
//       message: 'Login successful'
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };