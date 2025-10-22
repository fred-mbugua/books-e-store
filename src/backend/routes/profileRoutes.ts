import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate } from '../middlewares';

const router = Router();

// Apply authentication middleware to all profile routes
router.use(authenticate);

// Profile Dashboard
router.get('/', userController.getProfileDashboard);

// Order History
router.get('/orders', userController.getOrderHistory);
router.get('/orders/:orderId', userController.getOrderDetail);

// Edit Details (Placeholders)
router.get('/edit', userController.getEditDetails);
router.post('/edit', userController.postEditDetails);

export default router;