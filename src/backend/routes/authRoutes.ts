import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middlewares';

const router = Router();

// Login Routes
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// Registration (Signup) Routes
router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);

// Logout Route
// router.get('/logout', authenticate, authController.logout);

export default router;