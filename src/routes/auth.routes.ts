import { Router } from 'express';
import {
  loginUserHandler,
  logoutUserHandler,
  refreshAccessTokenHandler,
  registerUserHandler,
  verifyEmailHandler,
  resetPasswordHandler,
  forgotPasswordHandler,
} from '../controllers/auth.controller';
import { deserializeUser } from '../middleware/deserializeUser';
import { requireUser } from '../middleware/requireUser';
import { validate } from '../middleware/validate';
import {
  loginUserSchema,
  registerUserSchema,
  verifyEmailSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
} from '../schemas/user.schema';

const router = Router();

router.post('/register', validate(registerUserSchema), registerUserHandler);

router.post('/login', validate(loginUserSchema), loginUserHandler);

router.post(
  '/forgotpassword',
  validate(forgotPasswordSchema),
  forgotPasswordHandler
);

router.patch(
  '/resetpassword/:resetToken',
  validate(resetPasswordSchema),
  resetPasswordHandler
);

router.get('/refresh', refreshAccessTokenHandler);

router.get(
  '/verifyemail/:verificationCode',
  validate(verifyEmailSchema),
  verifyEmailHandler
);

router.get('/logout', deserializeUser, requireUser, logoutUserHandler);

export default router;