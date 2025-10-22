import { Request, Response } from 'express';
import { authService } from '../services';
import { logger } from '../utils';
import { UserRole } from '../types';

/**
 * Displaying the login page.
 */
export const getLogin = (req: Request, res: Response) => {
  // Rendering the login page view
  res.render('pages/admin/auth/login', {
    pageTitle: 'Login',
    isAuthenticated: !!req.user,
    error: req.query.error, // Passing potential errors to the view
  });
};

/**
 * Handling user login submission.
 */
export const postLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    // Handling missing credentials
    return res.status(400).render('pages/admin/auth/login', {
      pageTitle: 'Login',
      isAuthenticated: false,
      error: 'Please enter both email and password.',
    });
  }

  try {
    // Calling the login service
    const user = await authService.loginUser(email, password);

    // Setting the JWT token as a secure, signed, HTTP-only cookie
    res.cookie('token', user.token, {
      httpOnly: true, // Preventing client-side JavaScript access
      signed: true,   // Ensuring cookie integrity
      maxAge: 7 * 24 * 60 * 60 * 1000, // Setting cookie expiration (7 days)
      secure: process.env.NODE_ENV === 'production', // Requiring HTTPS in production
    });

    // Redirecting the user based on their role
    if (user.roleId === 1 || user.roleId === 2) {
      // Admin or ShopKeeper redirecting to dashboard
      return res.redirect('/admin/dashboard');
    }

    // Customer redirecting to the home page or book listing
    return res.redirect('/');  
    // return res.status(200).json({ message: 'Login successful', user });

  } catch (error) {
    // Logging the failed login attempt
    logger.warn(`Login failed for email: ${email}`, (error as Error).message);
    
    // Rendering the login page with an error message
    return res.status(401).render('pages/admin/auth/login', {
      pageTitle: 'Login',
      isAuthenticated: false,
      error: (error as Error).message || 'Invalid credentials.',
    });
  }
};

/**
 * Handling user registration submission.
 */
export const postRegister = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    // Handling missing fields
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Calling the register service
    const token = await authService.registerUser({
      email,
      password,
      firstName,
      lastName,
    });

    // Setting the JWT token as a cookie after successful registration
    res.cookie('token', token, {
      httpOnly: true,
      signed: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production',
    });

    // Redirecting to the home page after registration
    return res.redirect('/');
  } catch (error) {
    // Logging the failed registration attempt
    logger.error('Registration failed:', (error as Error).message);
    
    // Returning an error response
    return res.status(409).json({ message: (error as Error).message });
  }
};

/**
 * Logging out a user.
 */
export const getLogout = (req: Request, res: Response) => {
  // Clearing the JWT cookie to end the session
  res.clearCookie('token');
  
  // Storing an action log for user logout (if user was authenticated)
  if (req.user) {
    logger.info(`User ${req.user.userId} logged out.`);
    // Note: Log action is intentionally omitted here as cookie is cleared before this log would be meaningful
  }

  // Redirecting to the home page
  res.redirect('/');
};

/**
 * Displaying the Signup page.
 */
export const getSignup = (req: Request, res: Response) => {
    // If the user is already logged in, redirect them away from auth pages
    if (req.user) {
        return res.redirect('/');
    }
    res.render('pages/admin/auth/signup', {
        pageTitle: 'Register',
        error: null,
    });
};

/**
 * Handling the submission of the Registration (Signup) form.
 */
export const postSignup = async (req: Request, res: Response) => {
    const { firstName, lastName, email, password } = req.body;

    // Basic Server-Side Validation
    if (!firstName || !lastName || !email || !password || password.length < 8) {
        return res.status(400).render('pages/admin/auth/signup', {
            pageTitle: 'Register Error',
            error: 'All fields are required, and the password must be at least 8 characters.',
            // Retaining input values for user convenience
            firstName, lastName, email,
        });
    }

    try {
        // Creating the User
        // By default, new users register as 'customer' (Role ID 3)
        const token = await authService.registerUser({
            firstName,
            lastName,
            email,
            password,
            // roleId: UserRole.Customer, 
        });
        
        // User created successfully, log them in immediately (optional but good UX)
        // Setting the JWT token as a cookie after successful registration
        res.cookie('token', token, {
            httpOnly: true,
            signed: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            secure: process.env.NODE_ENV === 'production',
        });
        // For simplicity, we just redirect to the login page to enforce a login step.
        
        // Redirecting to login page with a success message
        res.redirect('/auth/login?status=registered');

    } catch (error) {
        logger.error('Registration failed:', error);
        
        // Handling specific errors like duplicate email
        if ((error as Error).message.includes('email already exists')) {
            return res.status(409).render('pages/auth/signup', {
                pageTitle: 'Register Error',
                error: 'This email address is already registered. Please log in.',
                firstName, lastName, email,
            });
        }
        
        // Handling general errors
        res.status(500).render('pages/auth/signup', {
            pageTitle: 'Register Error',
            error: 'Registration failed due to a server error.',
            firstName, lastName, email,
        });
    }
};