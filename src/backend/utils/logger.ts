// src/backend/utils/logger.ts

import { createLogger, format, transports } from 'winston';
import path from 'path';

const { combine, timestamp, printf, errors } = format;

// Defining the format for logs
const logFormat = printf(({ level, message, timestamp, stack }) => {
  // Formatting the log output with timestamp, level, and message/stack
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

// Creating the logger instance
const logger = createLogger({
  level: 'info', // Default log level
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Capturing stack trace for errors
    logFormat
  ),
  transports: [
    // Console Transport (for development visibility)
    new transports.Console({
      level: 'info',
      format: combine(format.colorize(), logFormat),
    }),
    
    // File Transport for Errors (critical and above)
    new transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error', // Only logging error and critical errors to this file
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File Transport for Combined Logs (info, warn, error)
    new transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Exporting the configured logger
export default logger;