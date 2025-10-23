// Defining the structure for an item inside the shopping cart
// export interface CartItem {
//     bookId: string;
//     quantity: number;
//     price: number; // Storing the current price at the time of adding to cart
//     title: string;
// }

export interface CartItem {
    book_id: string;
    title: string;
    author: string;
    image_url: string;
    price: number;
    quantity: number;
    stock_quantity: number; // For stock checking
}

/**
 * Defines the overall structure of the shopping cart stored in session/cookie.
 */
export interface Cart {
    cartId: string;
    items: CartItem[];
    totalQuantity: number;
    totalAmount: number;
}

// Defining the structure for the entire shopping cart object
export interface ShoppingCart {
    items: CartItem[];
    totalQuantity: number;
    totalAmount: number;
}