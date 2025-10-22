import { Request, Response } from 'express';
import { orderService } from '../services';
import { logger } from '../utils';

// --- Profile Dashboard ---
/**
 * Displaying the main user profile dashboard. (GET /profile)
 */
export const getProfileDashboard = (req: Request, res: Response) => {
    // req.user is populated by the authentication middleware
    res.render('pages/profile/dashboard', {
        pageTitle: 'My Account',
        user: req.user,
    });
};

// --- Order History List ---
/**
 * Displaying the user's list of past orders. (GET /profile/orders)
 */
export const getOrderHistory = async (req: Request, res: Response) => {
    if (!req.user) return res.redirect('/auth/login');

    try {
        
        const orders = await orderService.getOrdersByUserId(req.user.userId);

        res.render('pages/profile/orders', {
            pageTitle: 'My Orders',
            user: req.user,
            orders, // Array of orders
        });
    } catch (error) {
        logger.error('Failed to fetch user order history:', error);
        res.status(500).render('pages/error', {
            pageTitle: 'Error',
            errorCode: 500,
            errorMessage: 'Could not load order history.',
            isAuthenticated: res.locals.isAuthenticated,
        });
    }
};

// --- Order Detail View ---
/**
 * Displaying the details of a single past order. (GET /profile/orders/:orderId)
 */
export const getOrderDetail = async (req: Request, res: Response) => {
    if (!req.user) return res.redirect('/auth/login');
    const { orderId } = req.params;

    try {
        const order = await orderService.getOrderDetailByUserId(orderId, req.user.userId);
        
        if (!order) {
            return res.status(404).render('pages/error', {
                pageTitle: 'Order Not Found',
                errorCode: 404,
                errorMessage: 'The order you requested could not be found or does not belong to your account.',
                isAuthenticated: res.locals.isAuthenticated,
            });
        }

        res.render('pages/profile/order_details', { // Assuming a new EJS for details
            pageTitle: `Order #${order.order_id.substring(0, 8)}`,
            user: req.user,
            order,
        });
    } catch (error) {
        logger.error(`Failed to fetch user order ${orderId}:`, error);
        res.status(500).render('pages/error', {
            pageTitle: 'Error',
            errorCode: 500,
            errorMessage: 'Could not load order details.',
            isAuthenticated: res.locals.isAuthenticated,
        });
    }
};

// --- Placeholder for Edit Details/Security (GET /profile/edit, POST /profile/edit) ---
export const getEditDetails = (req: Request, res: Response) => {
    res.send('Profile Edit Page (TODO)');
};
export const postEditDetails = (req: Request, res: Response) => {
    res.send('Profile Edit POST (TODO)');
};