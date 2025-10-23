import { orderModel, bookModel, actionLogModel } from '../models';
import { CartItem, ShoppingCart } from '../types/cart';
import * as notificationService from './notificationService';
import { logger } from '../utils';
import express, { Request, Response, NextFunction } from 'express';

/**
 * Processing the checkout, creating the order, and sending notifications.
 */
export const processCheckout = async (
    cart: ShoppingCart,
    details: {
        userId?: string;
        email: string;
        name: string;
        phone: string;
        address: string;
    },
): Promise<string> => {
    // Validation
    if (cart.items.length === 0) {
        throw new Error('Cannot place an empty order.');
    }

    // Ensuring stock is available (Simplified check)
    // NOTE: To make the system robust I will add the ability to check stock and adjust within the database transaction.
    for (const item of cart.items) {
        const book = await bookModel.findBookById(item.book_id);
        if (!book || book.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for book: ${item.title}`);
        }
    }

    // Preparing order data
    const orderData = {
        userId: details.userId,
        guestEmail: details.email,
        guestName: details.name,
        guestPhone: details.phone,
        shippingAddress: details.address,
        totalAmount: cart.totalAmount,
        statusId: Number(await orderModel.getStatusIdByName('pending')!), // Get ID dynamically
        items: cart.items,
    };

    // Creating the order (DB transaction handled inside model)
    const orderId = await orderModel.createOrder(orderData);

    // Retrieving the full order details for notifications
    const orderDetails = await orderModel.findOrderDetailsById(orderId);

    // Sending Notifications
    if (orderDetails) {
        // Sending automated email to the customer
        await notificationService.sendOrderConfirmationEmail(orderDetails);
        // Sending automated WhatsApp/SMS to admin (for processing)
        await notificationService.sendAdminOrderAlert(orderDetails);
    }

    // Logging the action
    await actionLogModel.createActionLog({
        userId: details.userId,
        actionType: 'ORDER_PLACED',
        details: { orderId, total: orderData.totalAmount, itemsCount: cart.items.length },
    });

    return orderId;
};

/**
 * Fetching the full list of orders for the admin view.
 */
export const getAdminOrderList = async (): Promise<any[]> => {
    // Returning all orders with relevant user/status info
    return orderModel.findAllOrders();
};

/**
 * Fetching a single order with detailed information and available statuses.
 */
export const getOrderDetailAndStatuses = async (orderId: string): Promise<{ order: any; allStatuses: any[] } | null> => {
    // Fetching the order details
    const order = await orderModel.findOrderDetailsById(orderId);
    
    if (!order) return null;

    // Fetching all possible statuses for the dropdown
    const allStatuses = await orderModel.getAllStatuses();

    return { order, allStatuses };
};

/**
 * Updating an order status and notifying the customer if the status is new.
 */
export const updateOrderAndNotify = async (orderId: string, newStatusId: number, userId: string): Promise<boolean> => {
    // Fetching current order details to get the old status and customer info
    const oldOrderDetails = await orderModel.findOrderDetailsById(orderId);

    if (!oldOrderDetails) return false;

    // Checking if the status actually changed
    if (oldOrderDetails.status_id === newStatusId) {
        logger.info(`Order ${orderId} status already set to ${newStatusId}. Skipping update.`);
        return true;
    }

    // Updating the status in the database
    const success = await orderModel.updateOrderStatus(orderId, newStatusId);

    if (success) {
        // Retrieving the name of the new status
        const allStatuses = await orderModel.getAllStatuses();
        const newStatus = allStatuses.find(s => s.status_id === newStatusId);

        // Sending notification to customer (if status is 'processing', 'shipped', or 'delivered')
        if (newStatus && ['processing', 'shipped', 'delivered', 'cancelled'].includes(newStatus.status_name)) {
            // Re-fetch details to ensure notification has the new status name
            const updatedOrderDetails = await orderModel.findOrderDetailsById(orderId);
            if (updatedOrderDetails) {
                await notificationService.sendStatusUpdateNotification(updatedOrderDetails);
            }
        }

        // Logging the action
        await actionLogModel.createActionLog({
            userId,
            actionType: 'ORDER_STATUS_UPDATED',
            details: { 
                orderId, 
                oldStatus: oldOrderDetails.status_name, 
                newStatus: newStatus?.status_name 
            },
        });
    }

    return success;
};

/**
 * Fetching the order history for a specific registered user.
 */
export const getOrdersByUserId = async (userId: string): Promise<any[]> => {
    // Calling the new model function
    return orderModel.findOrdersByUserId(userId);
};

/**
 * Fetching details for a specific order, ensuring it belongs to the given user.
 */
export const getOrderDetailByUserId = async (orderId: string, userId: string): Promise<any> => {
    // Calling the new model function with user restriction
    return orderModel.findOrderDetailByOrderIdAndUserId(orderId, userId);
};

/**
 * Retrieves order details for the confirmation page, checking for user or guest ownership.
 */
export const getOrderDetailsForConfirmation = async (req: Request, orderId: string): Promise<any | null> => {
    // Check if the user is logged in
    if (req.user) {
        return orderModel.findOrderDetailByOrderIdAndUserId(orderId, req.user.userId);
    }

    // Handle Guest Order Confirmation
    // NOTE: For security, a guest can only view an order if the orderId 
    // matches a temporary ID stored in their session/cookie immediately after placing the order.
    
    // This is a placeholder for session/cookie verification logic:
    
    /* const isGuestAuthorized = req.session.lastConfirmedOrderId === orderId; 
    
    if (isGuestAuthorized) {
        return orderModel.findOrderDetailById(orderId); // A model function without user_id check
    }
    */
    
    // For now, if not logged in, we must assume the order belongs to a logged-in user 
    // unless a guest verification mechanism is fully implemented. 
    // Returning null is the safest default for unauthorized access.
    logger.warn(`Unauthorized attempt to view order confirmation for ${orderId}.`);
    return null;
};