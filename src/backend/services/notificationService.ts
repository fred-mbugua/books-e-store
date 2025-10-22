import * as emailService from '../emails/emailService';
import * as smsService from '../sms/smsService';
import { logger } from '../utils';

// Helper function to format order items for HTML/Text
const formatOrderItems = (items: any[]): string => {
    return items.map(item => 
        `<li>${item.title} (${item.quantity} x Ksh ${item.price_at_purchase.toFixed(2)})</li>`
    ).join('');
};

/**
 * Sending the order confirmation email to the customer.
 */
export const sendOrderConfirmationEmail = async (order: any) => {
    const subject = `Order #${order.order_id.substring(0, 8)} Confirmed!`;
    const htmlContent = `
        <h2>Thank you for your order, ${order.guest_name}!</h2>
        <p>Your order (ID: ${order.order_id.substring(0, 8)}) has been successfully placed and is currently <strong>${order.status_name}</strong>.</p>
        
        <h3>Order Details:</h3>
        <ul>
            ${formatOrderItems(order.items)}
        </ul>
        <p>Total Amount: <strong>Ksh ${order.total_amount.toFixed(2)}</strong></p>
        <p>We will notify you when your order status changes.</p>
        <p>Shipping Address: ${order.shipping_address}</p>
    `;

    // Sending the email to the customer
    await emailService.sendEmail(order.guest_email, subject, htmlContent);
};

/**
 * Sending a WhatsApp/SMS alert to the administrator.
 */
export const sendAdminOrderAlert = async (order: any) => {
    const message = `
    🚨 NEW ORDER PLACED!
    ID: ${order.order_id.substring(0, 8)}
    Total: Ksh ${order.total_amount.toFixed(2)}
    Customer: ${order.guest_name} (${order.guest_phone})
    Status: ${order.status_name}
    `;

    // Sending the alert to the admin
    await smsService.sendAdminAlert(message);
};

/**
 * Sending an order status update email to the customer.
 */
export const sendStatusUpdateNotification = async (order: any) => {
    const subject = `Update: Your Order #${order.order_id.substring(0, 8)} is now ${order.status_name.toUpperCase()}`;
    const htmlContent = `
        <h2>Order Status Update</h2>
        <p>Dear ${order.guest_name},</p>
        <p>We are pleased to inform you that your order (ID: <strong>${order.order_id.substring(0, 8)}</strong>) is now in the <strong>${order.status_name.toUpperCase()}</strong> stage.</p>
        
        <p><strong>Status Details:</strong></p>
        <ul>
            <li>**${order.status_name.toUpperCase()}**: Your order has been marked as ${order.status_name}.</li>
        </ul>
        <p>You can contact us if you have any questions regarding your delivery.</p>
        
        <p>Thank you for shopping with us!</p>
    `;

    // Sending the email to the customer
    await emailService.sendEmail(order.guest_email, subject, htmlContent);
    logger.info(`Sent status update for Order ${order.order_id.substring(0, 8)} to ${order.guest_email}.`);
};
