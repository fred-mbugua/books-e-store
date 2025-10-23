import { query } from './db';
import { CartItem } from '../types/cart';
import { PoolClient } from 'pg'; // Need this for database transactions

/**
 * Interface for new order data structure.
 */
interface OrderData {
    userId?: string;
    guestEmail: string;
    guestName: string;
    guestPhone: string;
    shippingAddress: string;
    totalAmount: number;
    statusId: number;
    items: CartItem[];
}

/**
 * Retrieving the ID of a status by its name.
 */
export const getStatusIdByName = async (statusName: string): Promise<number | null> => {
    const sql = 'SELECT status_id FROM order_statuses WHERE status_name = $1';
    const result = await query(sql, [statusName]);
    // Returning the ID if found
    return result.rows[0]?.status_id || null;
};

/**
 * Creating a new order and its corresponding order items within a transaction.
 */
export const createOrder = async (orderData: OrderData): Promise<string> => {
    // Acquiring a client from the pool for a transaction
    const client: PoolClient = await (await import('./db')).default.connect();
    
    try {
        await client.query('BEGIN'); // Starting the transaction

        // Getting the 'pending' status ID
        const pendingStatusId = await getStatusIdByName('pending');
        if (!pendingStatusId) {
            throw new Error('Order status "pending" not found in database.');
        }

        // Creating the main order record
        const orderSql = `
            INSERT INTO orders (user_id, guest_email, guest_name, guest_phone, shipping_address, total_amount, status_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING order_id;
        `;
        const orderParams = [
            orderData.userId || null,
            orderData.guestEmail,
            orderData.guestName,
            orderData.guestPhone,
            orderData.shippingAddress,
            orderData.totalAmount,
            pendingStatusId,
        ];

        const orderResult = await client.query(orderSql, orderParams);
        const orderId: string = orderResult.rows[0].order_id;

        // Inserting order items
        const itemValues = orderData.items.map(item => [
            orderId,
            item.book_id,
            item.quantity,
            item.price,
        ]);

        const itemSql = `
            INSERT INTO order_items (order_id, book_id, quantity, price_at_purchase)
            VALUES ${itemValues.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ')}
            RETURNING item_id;
        `;
        // Flattening the item values array for the SQL query
        const itemParams = itemValues.flat();

        await client.query(itemSql, itemParams);

        await client.query('COMMIT'); // Committing the transaction
        
        // Returning the ID of the newly created order
        return orderId;
    } catch (error) {
        await client.query('ROLLBACK'); // Rolling back on error
        throw error;
    } finally {
        client.release(); // Releasing the client back to the pool
    }
};

/**
 * Retrieving a single order by ID along with its items.
 */
export const findOrderDetailsById = async (orderId: string) => {
    // Querying the main order and status details
    const orderSql = `
        SELECT o.*, os.status_name
        FROM orders o
        JOIN order_statuses os ON o.status_id = os.status_id
        WHERE o.order_id = $1;
    `;
    const orderResult = await query(orderSql, [orderId]);
    const order = orderResult.rows[0];

    if (!order) return null;

    // Querying the associated order items
    const itemsSql = `
        SELECT oi.*, b.title, b.author
        FROM order_items oi
        JOIN books b ON oi.book_id = b.book_id
        WHERE oi.order_id = $1;
    `;
    const itemsResult = await query(itemsSql, [orderId]);

    // Combining order and items data
    return {
        ...order,
        items: itemsResult.rows,
    };
};

/**
 * Retrieving all orders for the Admin Dashboard.
 */
export const findAllOrders = async (): Promise<any[]> => {
    // Selecting all orders, joining with user and status details
    const sql = `
        SELECT 
            o.order_id, 
            o.guest_name, 
            o.total_amount, 
            o.created_at, 
            os.status_name,
            u.email AS user_email
        FROM orders o
        JOIN order_statuses os ON o.status_id = os.status_id
        LEFT JOIN users u ON o.user_id = u.user_id
        ORDER BY o.created_at DESC;
    `;
    const result = await query(sql);
    return result.rows;
};

/**
 * Retrieving all available order statuses.
 */
export const getAllStatuses = async (): Promise<{ status_id: number; status_name: string }[]> => {
    const sql = 'SELECT status_id, status_name FROM order_statuses ORDER BY status_id ASC';
    const result = await query(sql);
    return result.rows;
};

/**
 * Updating the status of a specific order.
 */
export const updateOrderStatus = async (orderId: string, statusId: number): Promise<boolean> => {
    const sql = `
        UPDATE orders
        SET status_id = $2, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $1
        RETURNING order_id;
    `;
    const result = await query(sql, [orderId, statusId]);
    return (result.rowCount ?? 0) > 0;
};

/**
 * Retrieving all orders associated with a specific user ID.
 */
export const findOrdersByUserId = async (userId: string): Promise<any[]> => {
    const sql = `
        SELECT 
            o.order_id, 
            o.total_amount, 
            o.order_date, 
            os.status_name
        FROM orders o
        JOIN order_statuses os ON o.status_id = os.status_id
        WHERE o.user_id = $1
        ORDER BY o.order_date DESC;
    `;
    const result = await query(sql, [userId]);
    return result.rows;
};

/**
 * Retrieving a single order by ID, restricted to a specific user ID.
 * This ensures a user can only view their own orders.
 */
export const findOrderDetailByOrderIdAndUserId = async (orderId: string, userId: string) => {
    //  Querying the main order and status details
    const orderSql = `
        SELECT o.*, os.status_name
        FROM orders o
        JOIN order_statuses os ON o.status_id = os.status_id
        WHERE o.order_id = $1 AND o.user_id = $2;
    `;
    const orderResult = await query(orderSql, [orderId, userId]);
    const order = orderResult.rows[0];

    if (!order) return null;

    //  Querying the associated order items (same as findOrderDetailsById)
    const itemsSql = `
        SELECT oi.*, b.title, b.author
        FROM order_items oi
        JOIN books b ON oi.book_id = b.book_id
        WHERE oi.order_id = $1;
    `;
    const itemsResult = await query(itemsSql, [orderId]);

    // Combining order and items data
    return {
        ...order,
        items: itemsResult.rows,
    };
};

/**
 * Retrieving a single order by ID without checking the user_id (for authorized guest/admin use).
 */
export const findOrderDetailById = async (orderId: string) => {
    const orderSql = `
        SELECT o.*, os.status_name
        FROM orders o
        JOIN order_statuses os ON o.status_id = os.status_id
        WHERE o.order_id = $1;
    `;
    const orderResult = await query(orderSql, [orderId]);
    const order = orderResult.rows[0];

    if (!order) return null;

    const itemsSql = `
        SELECT oi.*, b.title, b.author
        FROM order_items oi
        JOIN books b ON oi.book_id = b.book_id
        WHERE oi.order_id = $1;
    `;
    const itemsResult = await query(itemsSql, [orderId]);

    return {
        ...order,
        items: itemsResult.rows,
    };
};