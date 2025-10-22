import { logger } from '../utils';

// Admin WhatsApp number for alerts
const ADMIN_WHATSAPP = process.env.WHATSAPP_ADMIN_NUMBER;

/**
 * Sending a WhatsApp message (Placeholder for third-party API).
 */
export const sendWhatsAppMessage = async (to: string, message: string) => {
    // NOTE: This function should call a service like Twilio or an equivalent API.
    logger.info(`[WhatsApp/SMS Placeholder] Sending to ${to}: ${message.substring(0, 50)}...`);
    
    // Simulating API call success
    return true; 
};

/**
 * Sending an alert message to the admin via WhatsApp/SMS.
 */
export const sendAdminAlert = async (message: string) => {
    if (!ADMIN_WHATSAPP) {
        logger.warn('Admin WhatsApp number not configured. Cannot send order alert.');
        return;
    }
    
    // Calling the WhatsApp/SMS sending function
    await sendWhatsAppMessage(ADMIN_WHATSAPP, message);
};