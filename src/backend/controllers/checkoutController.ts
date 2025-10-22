import { Request, Response } from 'express';
import { cartUtils, logger } from '../utils';
import { bookService, orderService } from '../services';

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
        let itemIndex = cart.items.findIndex(item => item.bookId === bookId);
        
        if (itemIndex > -1) {
            // Updating existing item quantity
            cart.items[itemIndex].quantity += qty;
        } else {
            // Adding new item
            const newItem = {
                bookId: book.book_id,
                quantity: qty,
                price: book.price,
                title: book.title,
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
        return res.redirect(`/order/confirmation?id=${orderId.substring(0, 8)}`);

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