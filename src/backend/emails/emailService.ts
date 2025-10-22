import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { logger } from '../utils';
dotenv.config();

// Creating the Nodemailer transporter (using environment variables)
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

/**
 * Sending an email using the configured transporter.
 */
export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            html: htmlContent,
        };

        // Sending the email
        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent to ${to}: ${info.messageId}`);
    } catch (error) {
        // Logging the failure to send email
        logger.error(`Failed to send email to ${to}:`, error);
    }
};