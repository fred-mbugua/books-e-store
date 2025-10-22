import { query } from './db';

/**
 * Fetching sales data grouped by date.
 */
export const getSalesByDate = async (): Promise<any[]> => {
    const sql = `
        SELECT
            DATE(o.created_at) AS sale_date,
            COUNT(o.order_id) AS total_orders,
            SUM(o.total_amount) AS total_revenue
        FROM orders o
        WHERE o.status_id NOT IN (
            SELECT status_id FROM order_statuses WHERE status_name IN ('pending', 'cancelled')
        ) -- Only count completed/shipped/delivered orders
        GROUP BY sale_date
        ORDER BY sale_date DESC;
    `;
    const result = await query(sql);
    return result.rows;
};

/**
 * Fetching list of all users and their role for the User Report.
 */
export const getAllUsersReport = async (): Promise<any[]> => {
    const sql = `
        SELECT
            u.user_id,
            u.email,
            u.first_name,
            u.last_name,
            ur.role_name,
            u.created_at
        FROM users u
        JOIN user_roles ur ON u.role_id = ur.role_id
        ORDER BY u.created_at DESC;
    `;
    const result = await query(sql);
    return result.rows;
};

/**
 * Fetching a list of all orders with all details for the Order Report.
 */
export const getAllOrdersReport = async (): Promise<any[]> => {
    const sql = `
        SELECT
            o.order_id,
            os.status_name AS current_status,
            o.guest_name AS customer_name,
            o.guest_email AS customer_email,
            o.total_amount,
            o.shipping_address,
            o.created_at
        FROM orders o
        JOIN order_statuses os ON o.status_id = os.status_id
        ORDER BY o.created_at DESC;
    `;
    const result = await query(sql);
    return result.rows;
};