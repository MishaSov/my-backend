import { NextFunction, Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';

// export const createUser = async (req: Request, res: Response) => {
//   try {
//     const { email, name, password } = req.body;

//     // Проверка существующего пользователя
//     const existingUser = await prisma.user.findUnique({
//       where: { email }
//     });

//     if (existingUser) {
//       return res.status(400).json({ error: 'User already exists' });
//     }

//     // Хэширование пароля
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Создание пользователя
//     const user = await prisma.user.create({
//       data: {
//         email,
//         name,
//         password: hashedPassword
//       },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         createdAt: true
//       }
//     });

//     res.status(201).json(user);
//   } catch (error) {
//     console.error('Create user error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

export const getMeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user;

    res.status(200).status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (err: any) {
    next(err);
  }
};
