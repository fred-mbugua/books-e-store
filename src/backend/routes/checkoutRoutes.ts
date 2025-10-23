import { Router } from 'express';
import { cartService } from '../services';
import * as checkoutController from '../controllers/checkoutController';

const router = Router();

// Cart Operations (AJAX)
router.post('/cart/add', checkoutController.postAddToCart);
router.post('/cart/update', checkoutController.postUpdateCart);
router.post('/cart/remove', checkoutController.postRemoveFromCart);

// Cart View
router.get('/cart', checkoutController.getCart);

// Checkout
router.get('/checkout', checkoutController.getCheckout);

// Order Placement
router.post('/place-order', checkoutController.postPlaceOrder);
router.get('/order-confirmation/:orderId', checkoutController.getOrderConfirmation);

export default router;