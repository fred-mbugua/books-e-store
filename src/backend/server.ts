import express, { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';
import { query } from './models';
import { logger } from './utils';
import { authRoutes, bookRoutes, adminRoutes, checkoutRoutes } from './routes';
import { authService } from './services';
import { authenticate } from './middlewares/authMiddleware';
import { userModel } from './models';

// Loading environment variables
dotenv.config();

// Creating the express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for logging requests
app.use((req: Request, res: Response, next: NextFunction) => {
    // Logging incoming request details
    logger.info(`[REQ] ${req.method} ${req.url}`);
    next();
});

// Middleware for parsing JSON bodies
app.use(express.json());

// Middleware for parsing URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Middleware for parsing and signing cookies (using COOKIE_SECRET from .env)
app.use(cookieParser(process.env.COOKIE_SECRET));

// Setting EJS as the view engine
app.set('view engine', 'ejs');
// Setting the path to the views directory
app.set('views', path.join(__dirname, '../frontend/views'));

// Serving static files
app.use(express.static(path.join(__dirname, '../../src/frontend/public'))); 

// Global middleware for checking authentication status and fetching user details (for views)
app.use(async (req: Request, res: Response, next: NextFunction) => {
    // Checking for the JWT token in signed cookies
    const token = req.signedCookies.token;
    
    // Setting default view locals
    res.locals.isAuthenticated = false;
    res.locals.user = null;

    if (token) {
        // Verifying the token and getting the payload
        const payload = authService.verifyToken(token);
        
        if (payload) {
            // Fetching user details using the ID from the payload
            const user = await userModel.findUserById(payload.userId);
            
            if (user) {
                // Setting user data on the request object for controllers (AuthMiddleware will overwrite this but it's fine)
                req.user = payload; 
                // Setting view locals for EJS templates
                res.locals.isAuthenticated = true;
                res.locals.user = { userId: user.user_id, firstName: user.first_name, lastName: user.last_name, email: user.email, phone: user.phone_number, roleId: user.role_id };
            }
        }
    }
    next();
});

// Route for the home page (using updated view locals)
app.get('/', (req: Request, res: Response) => {
    // Rendering the home page view, using res.locals for view data
    res.render('pages/home', {
        pageTitle: 'Home | Book Store',
    });
});

// --- Registering Routes ---
app.use('/auth', authRoutes); // Authentication routes
app.use('/books', bookRoutes); // Public book catalog routes
app.use('/admin', adminRoutes); // Protected admin dashboard routestication actions
app.use('/shop', checkoutRoutes); // Checkout and order routes

// --- Error Handling Middleware (Keep last) ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    // Logging internal server error
    logger.error('Internal Server Error:', err);
    // Rendering a generic error page
    res.status(500).render('pages/error', {
        pageTitle: 'Error',
        errorCode: 500,
        errorMessage: 'Something went wrong on our end. Please try again later.',
        isAuthenticated: res.locals.isAuthenticated,
    });
});

// Catch-all for 404 Not Found
app.use((req: Request, res: Response) => {
    res.status(404).render('pages/error', {
        pageTitle: '404 Not Found',
        errorCode: 404,
        errorMessage: `The path ${req.originalUrl} was not found on this server.`,
        isAuthenticated: res.locals.isAuthenticated,
    });
});

// General Error Handler (e.g., 500 Internal Server Error)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled Error:', err);

    // Default to 500 if status code wasn't set earlier
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode; 
    
    res.status(statusCode).render('pages/error', {
        pageTitle: `Error ${statusCode}`,
        errorCode: statusCode,
        errorMessage: process.env.NODE_ENV === 'production' 
            ? 'We encountered an unexpected server error. Please try again.' 
            : `Server Error: ${err.message}`, // Show detailed error in development
        isAuthenticated: res.locals.isAuthenticated,
    });
});

// Starting the server
app.listen(PORT, () => {
    // Server successfully listening
    logger.info(`Server is running on http://localhost:${PORT}`);
    // Testing database connection
    query('SELECT NOW()')
        .then(() => logger.info('Database connection tested successfully.'))
        .catch(err => logger.error('Database connection test failed:', err.message));
});