import { Router } from 'express';
import { login, logout, refresh, signup, getMe } from '../controllers/authController';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import { loginSchema, refreshSchema, signupSchema, logoutSchema } from '../validations/authValidation';

const router = Router();

// Public routes
router.post('/signup', validateRequest(signupSchema), signup);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh', validateRequest(refreshSchema), refresh);

// Protected routes
router.post('/logout', authenticate, validateRequest(logoutSchema), logout);
router.get('/me', authenticate, getMe);

export default router;
