import { Request, Response } from 'express';
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

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Проверяем, что id существует и это строка
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const userId = parseInt(id);

    // Проверяем, что это валидное число
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'User ID must be a number' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};