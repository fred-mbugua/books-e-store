import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { bookModel } from '../models';
import { Cart, CartItem } from '../types';
import { logger } from '../utils';

// --- Configuration ---
const CART_COOKIE_NAME = 'bookstore_cart';
const CART_COOKIE_OPTIONS = {
    httpOnly: true,
    signed: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: process.env.NODE_ENV === 'production',
};

// --- Helper Functions ---

/**
 * Calculates the total quantity and total amount of the cart.
 */
export const recalculateCartTotals = (cart: Cart): Cart => {
    cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    return cart;
};

/**
 * Reads the cart data from the signed cookie or creates a new empty cart.
 */
export const getCart = (req: Request, res: Response): Cart => {
 
    try {
        // req.signedCookies is used because the cookie is set with { signed: true }
        const cartJson = req.signedCookies[CART_COOKIE_NAME];
        if (cartJson) {
            const cart = JSON.parse(cartJson) as Cart;
            console.log("Cart from cookie: ", cart)
            // Always recalculate totals on load to ensure data integrity
            return recalculateCartTotals(cart);
        }
    } catch (e) {
        logger.error("Error reading cart cookie:", e);
        // Fall through to return a new cart if reading fails
    }

    return {
        cartId: randomUUID(),
        items: [],
        totalQuantity: 0,
        totalAmount: 0,
    };
};

/**
 * Writes the cart data back to the signed cookie.
 */
export const saveCart = (res: Response, cart: Cart): void => {
    const cartJson = JSON.stringify(cart);
    res.cookie(CART_COOKIE_NAME, cartJson, CART_COOKIE_OPTIONS);
};


// --- Main Service Functions ---

/**
 * Adds a book to the cart or updates the quantity if it already exists.
 */
export const addCartItem = async (req: Request, res: Response, bookId: string, quantity: number): Promise<Cart> => {
    let cart = getCart(req, res);
    const bookDetails = await bookModel.findBookById(bookId);

    if (!bookDetails || !bookDetails.is_active) {
        throw new Error('Book not found or is currently unavailable.');
    }

    const itemIndex = cart.items.findIndex(item => item.book_id === bookId);

    if (itemIndex > -1) {
        // Item exists: update quantity
        const newQuantity = cart.items[itemIndex].quantity + quantity;

        if (newQuantity > bookDetails.stock_quantity) {
            throw new Error(`Cannot add. Total quantity exceeds stock of ${bookDetails.stock_quantity}.`);
        }
        
        cart.items[itemIndex].quantity = newQuantity;
    } else {
        // New item: check stock immediately
        if (quantity > bookDetails.stock_quantity) {
             throw new Error(`Cannot add. Quantity exceeds stock of ${bookDetails.stock_quantity}.`);
        }
        
        // Create new cart item
        const newItem: CartItem = {
            book_id: bookDetails.book_id,
            title: bookDetails.title,
            author: bookDetails.author,
            image_url: bookDetails.image_url,
            price: bookDetails.price,
            quantity: quantity,
            stock_quantity: bookDetails.stock_quantity,
        };
        cart.items.push(newItem);
    }
    
    // Recalculate and save
    cart = recalculateCartTotals(cart);
    saveCart(res, cart);

    return cart;
};

/**
 * Updates the quantity of a specific item in the cart (used by /cart/update endpoint).
 */
export const updateCartItem = async (req: Request, res: Response, bookId: string, newQuantity: number): Promise<Cart> => {
    let cart = getCart(req, res);
    console.log("Cart: ", cart)
    const itemIndex = cart.items.findIndex(item => item.book_id === bookId);

    if (itemIndex === -1) {
        throw new Error('Item not found in cart.');
    }
    
    const bookDetails = await bookModel.findBookById(bookId);
    if (!bookDetails || newQuantity > bookDetails.stock_quantity) {
        throw new Error(`Quantity exceeds available stock of ${bookDetails?.stock_quantity || 0}.`);
    }

    cart.items[itemIndex].quantity = newQuantity;
    
    // Recalculate and save
    cart = recalculateCartTotals(cart);
    saveCart(res, cart);

    return cart;
};

/**
 * Removes a specific item from the cart.
 */
export const removeCartItem = async (req: Request, res: Response, bookId: string): Promise<Cart> => {
    let cart = getCart(req, res);
    const initialLength = cart.items.length;

    cart.items = cart.items.filter(item => item.book_id !== bookId);

    if (cart.items.length === initialLength) {
        // Should theoretically not happen if frontend sends correct ID
        throw new Error('Item not found to remove.'); 
    }
    
    // Recalculate and save
    cart = recalculateCartTotals(cart);
    saveCart(res, cart);

    return cart;
};

// ... other cart-related functions (e.g., clearCart, cartToOrder) can be added here