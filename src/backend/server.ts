import express, { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';
// Importing database query function to ensure connection
import { query } from './models';

// Loading environment variables
dotenv.config();

// Creating the express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for logging requests
app.use((req: Request, res: Response, next: NextFunction) => {
    // Logging incoming request
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Middleware for parsing JSON bodies
app.use(express.json());

// Middleware for parsing URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Middleware for parsing and signing cookies
app.use(cookieParser(process.env.COOKIE_SECRET));

// Setting EJS as the view engine
app.set('view engine', 'ejs');
// Setting the path to the views directory
app.set('views', path.join(__dirname, '../frontend/views'));

// Serving static files (CSS, JS, images)
// __dirname is dist/backend, so we navigate back to dist and then into frontend/public
app.use(express.static(path.join(__dirname, '../../src/frontend/public'))); 

// Initializing a basic route for the home page
app.get('/', (req: Request, res: Response) => {
    // Rendering the home page view, setting initial data
    res.render('pages/home', {
        pageTitle: 'Home | Book Store',
        isAuthenticated: false, // Placeholder for authentication status
        user: null, // Placeholder for user data
    });
});

// Starting the server
app.listen(PORT, () => {
    // Server successfully listening
    console.log(`Server is running on http://localhost:${PORT}`);
    // Testing database connection (optional, connection is established via the pool import)
    query('SELECT NOW()').then(() => {
        console.log('Database connection tested successfully.');
    }).catch(err => {
        console.error('Database connection test failed:', err.message);
    });
});