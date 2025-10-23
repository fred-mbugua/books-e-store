import { Request, Response } from 'express';
import { cartUtils, logger } from '../utils';
import { bookService, orderService, cartService } from '../services';

/**
 * Displaying the shopping cart page.
 */
export const getCart = async (req: Request, res: Response) => {
    // Retrieving cart data from the cookie
    const cart = cartUtils.getCartFromCookie(req);

    // Rendering the cart view
    res.render('pages/cart', {
        pageTitle: 'Shopping Cart',
        cart,
    });
};

/**
 * Adding a book to the shopping cart --via AJAX POST.
 */
export const postAddToCart = async (req: Request, res: Response) => {
    const { bookId, quantity } = req.body;
    const qty = parseInt(quantity, 10);
    
    if (!bookId || qty <= 0) {
        return res.status(400).json({ message: 'Invalid product or quantity.' });
    }

    try {
        // Fetching current book data
        const book = await bookService.getBookById(bookId);
        if (!book || !book.is_active || book.stock_quantity < qty) {
            return res.status(400).json({ message: 'Book not available or insufficient stock.' });
        }

        // Retrieving existing cart
        const cart = cartUtils.getCartFromCookie(req);

        // Updating cart logic
        let itemIndex = cart.items.findIndex(item => item.book_id === bookId);
        
        if (itemIndex > -1) {
            // Updating existing item quantity
            cart.items[itemIndex].quantity += qty;
        } else {
            // Adding new item (use property names expected by CartItem)
            const newItem = {
                book_id: book.book_id,
                quantity: qty,
                price: book.price,
                title: book.title,
                image_url: book.image_url,
                author: book.author || '',
                stock_quantity: book.stock_quantity || 0,
            };
            cart.items.push(newItem);
        }

        // Recalculating totals
        cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

        // Saving cart back to cookie
        cartUtils.saveCartToCookie(res, cart);

        // Success response
        return res.status(200).json({ 
            message: `${book.title} added to cart.`, 
            cartCount: cart.totalQuantity 
        });

    } catch (error) {
        logger.error('Error adding to cart:', error);
        return res.status(500).json({ message: 'Server error adding item to cart.' });
    }
};

/**
 * Displaying the checkout form.
 */
export const getCheckout = (req: Request, res: Response) => {
    const cart = cartUtils.getCartFromCookie(req);

    if (cart.items.length === 0) {
        return res.redirect('/shop/cart');
    }

    // Checking if user is logged in (from res.locals setup in server.ts)
    const isAuthenticated = res.locals.isAuthenticated;
    const user = res.locals.user;

    // console.log('Checkout - isAuthenticated:', isAuthenticated);
    // console.log('Checkout - User:', res.locals.user);
    
    // Rendering the checkout view
    res.render('pages/checkout', {
        pageTitle: 'Checkout',
        cart,
        isAuthenticated,
        // Pre-populating form fields if user is logged in
        prefill: {
            email: isAuthenticated ? user.email : '', // Assuming email is on the user object
            name: isAuthenticated ? `${user.firstName} ${user.lastName}` : '',
            phone: '', // Phone number is not mandatory
            address: '',
        },
        error: null,
    });
};

/**
 * Handling the final order placement.
 */
export const postPlaceOrder = async (req: Request, res: Response) => {
    const cart = cartUtils.getCartFromCookie(req);

    if (cart.items.length === 0) {
        return res.redirect('/shop/cart');
    }

    const { name, email, phone, address } = req.body;

    // Validation
    if (!name || !email || !phone || !address) {
        return res.status(400).render('pages/checkout', {
            pageTitle: 'Checkout Error',
            cart,
            isAuthenticated: res.locals.isAuthenticated,
            prefill: req.body,
            error: 'All contact and address fields are required.',
        });
    }

    try {
        // Determining if the user is registered (if logged in)
        const userId = req.user?.userId; // Set by authenticate middleware
        
        // Processing the order
        const orderId = await orderService.processCheckout(cart, {
            userId,
            email,
            name,
            phone,
            address,
        });

        // Clearing the cart cookie after successful order
        cartUtils.clearCartCookie(res);

        // Redirecting to a confirmation page
        return res.redirect(`shop/order-confirmation/?id=${orderId.substring(0, 8)}`);

    } catch (error) {
        logger.error('Order placement failed:', error);
        // Rendering the checkout page with error
        return res.status(500).render('pages/checkout', {
            pageTitle: 'Checkout Error',
            cart,
            isAuthenticated: res.locals.isAuthenticated,
            prefill: req.body,
            error: (error as Error).message || 'Failed to place order due to a server error.',
        });
    }
};

/**
 * Handles AJAX request to update the quantity of an item in the cart. (POST /cart/update)
 */
export const postUpdateCart = async (req: Request, res: Response) => {
    const { bookId, quantity } = req.body;
    const newQuantity = parseInt(quantity, 10);

    if (newQuantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1.' });
    }

    try {
        const cart = await cartService.updateCartItem(req, res, bookId, newQuantity);

        // Success: Return new totals for client-side update
        return res.status(200).json({
            message: 'Cart item quantity updated.',
            totalQuantity: cart.totalQuantity,
            totalAmount: cart.totalAmount,
        });
    } catch (error) {
        logger.error('Error updating cart item quantity:', error);
        
        // Return current quantity to allow client to revert input field if necessary
        const currentCart = await cartService.getCart(req, res);
        const currentQuantity = currentCart.items.find(i => i.book_id === bookId)?.quantity || 1;

        return res.status(400).json({
            message: (error as Error).message || 'Failed to update quantity.',
            currentQuantity: currentQuantity,
        });
    }
};

/**
 * Handles AJAX request to remove an item completely from the cart. (POST /cart/remove)
 */
export const postRemoveFromCart = async (req: Request, res: Response) => {
    const { bookId } = req.body;

    try {
        const cart = await cartService.removeCartItem(req, res, bookId);

        // Success: Return new totals for client-side update
        return res.status(200).json({
            message: 'Item successfully removed.',
            totalQuantity: cart.totalQuantity,
            totalAmount: cart.totalAmount,
        });
    } catch (error) {
        logger.error('Error removing cart item:', error);
        return res.status(500).json({ message: 'Failed to remove item from cart.' });
    }
};

/**
 * Displaying the final order confirmation page after successful placement. (GET /order-confirmation/:orderId)
 */
export const getOrderConfirmation = async (req: Request, res: Response) => {
    const { orderId } = req.params;

    try {
        // Fetch the order details
        // Note: This must handle both logged-in users and guest users (by checking session/cookie).
        const order = await orderService.getOrderDetailsForConfirmation(req, orderId);

        if (!order) {
            return res.status(404).render('pages/error', {
                pageTitle: 'Order Not Found',
                errorCode: 404,
                errorMessage: 'The order confirmation link is invalid or expired.',
                isAuthenticated: res.locals.isAuthenticated,
            });
        }
        
        // Clear guest order ID from session/cookie if it was used for confirmation
        // Assuming the order ID is stored in the session/cookie temporarily post-checkout
        // Example: if (req.session.lastOrderId === orderId) req.session.lastOrderId = null; 

        res.render('pages/confirmation', {
            pageTitle: 'Order Confirmed!',
            orderId: order.order_id,
            order, // Pass full order details to the EJS template if needed
            // Include other data needed by the confirmation page (e.g., payment instructions)
        });

    } catch (error) {
        logger.error(`Error loading order confirmation for ${orderId}:`, error);
        res.status(500).render('pages/error', {
            pageTitle: 'Error',
            errorCode: 500,
            errorMessage: 'Could not load order confirmation details.',
            isAuthenticated: res.locals.isAuthenticated,
        });
    }
};