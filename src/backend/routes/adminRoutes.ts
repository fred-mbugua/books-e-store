// src/backend/routes/adminRoutes.ts

import { Router } from 'express';
import {adminController} from '../controllers';
import { authenticate, authorize } from '../middlewares';
import { UserRole } from '../types';

const router = Router();

// Define roles for route authorization
const ADMIN_ONLY = [UserRole.Admin]; // Role ID 1
const ADMIN_AND_SHOPKEEPER = [UserRole.Admin, UserRole.ShopKeeper]; // Role IDs 1 and 2

// Apply authentication and authorization (Shopkeeper minimum) to all admin routes
router.use(authenticate, authorize(ADMIN_AND_SHOPKEEPER));

// --- Dashboard ---
// router.get('/dashboard', adminController.getAdminDashboard);

// --- Book Management ---
// router.get('/books', adminController.getAdminBookList);
router.get('/books/add', adminController.getAddBook);
router.post('/books/add', adminController.postAddBook);
router.get('/books/edit/:bookId', adminController.getEditBook);
router.post('/books/edit/:bookId', adminController.postEditBook);
router.post('/books/delete', adminController.postDeleteBook); // Soft delete/deactivate

// --- Order Management ---
router.get('/orders', adminController.getAdminOrders);
router.get('/orders/:orderId', adminController.getOrderDetails);
router.post('/orders/:orderId/update-status', adminController.postUpdateOrderStatus);

// --- Reporting Routes (Admin Only) ---
router.get('/reports', authorize(ADMIN_ONLY), adminController.getReportsPage);
router.get('/reports/generate', authorize(ADMIN_ONLY), adminController.getGenerateReport);

export default router;