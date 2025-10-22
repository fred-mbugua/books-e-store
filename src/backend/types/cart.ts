// Defining the structure for an item inside the shopping cart
export interface CartItem {
    bookId: string;
    quantity: number;
    price: number; // Storing the current price at the time of adding to cart
    title: string;
}

// Defining the structure for the entire shopping cart object
export interface ShoppingCart {
    items: CartItem[];
    totalQuantity: number;
    totalAmount: number;
}