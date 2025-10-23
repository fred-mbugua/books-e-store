import { Request, Response } from 'express';
// import { CartItem, ShoppingCart } from '../types/cart';
import * as cartTypes from '../types';

// Cookie key for the shopping cart
const CART_COOKIE_NAME = 'bookstore_cart';

/**
 * Retrieving the cart data from the signed cookie.
 * @param req The Express Request object.
 * @returns The parsed ShoppingCart object or an empty default cart.
 */
export const getCartFromCookie = (req: Request): cartTypes.ShoppingCart => {
    // Retrieving the signed cart cookie
    const rawCart = req.signedCookies[CART_COOKIE_NAME];
    
    if (rawCart) {
        try {
            // Parsing the JSON string from the cookie
            const cart: cartTypes.ShoppingCart = JSON.parse(rawCart);
            // Ensuring the cart structure is valid, otherwise returning default
            if (cart && Array.isArray(cart.items)) {
                return cart;
            }
        } catch (error) {
            // Logging if the cookie is malformed
            console.error('Error parsing cart cookie:', error);
        }
    }
    
    // Returning a default empty cart if not found or invalid
    return { items: [], totalQuantity: 0, totalAmount: 0 };
};

/**
 * Saving the cart data to a signed, HTTP-only cookie.
 * @param res The Express Response object.
 * @param cart The ShoppingCart object to save.
 */
export const saveCartToCookie = (res: Response, cart: cartTypes.ShoppingCart) => {
    // Serializing the cart object to a JSON string
    const cartString = JSON.stringify(cart);
    
    // Setting the secure, signed, HTTP-only cookie
    res.cookie(CART_COOKIE_NAME, cartString, {
        httpOnly: true,
        signed: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration
        secure: process.env.NODE_ENV === 'production',
    });
};

/**
 * Clearing the shopping cart cookie.
 * @param res The Express Response object.
 */
export const clearCartCookie = (res: Response) => {
    // Clearing the cart cookie after checkout
    res.clearCookie(CART_COOKIE_NAME);
};