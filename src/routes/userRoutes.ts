import { Router } from 'express';
import {
  createUser,
  getUsers,
  getUserById,
//   updateUser,
//   deleteUser
} from '../controllers/userController';
// import { authMiddleware } from '../middleware/auth';

const router = Router();

// Публичные маршруты
router.post('/', createUser);
router.get('/', getUsers);
router.get('/:id', getUserById);

// Защищенные маршруты (требуют аутентификации)
// router.put('/:id', authMiddleware, updateUser);
// router.delete('/:id', authMiddleware, deleteUser);

export default router;