import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import { JwtPayload, UserRole } from '../types';

// Augmenting the Express Request object to include user information
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Protecting routes by verifying the JWT in the 'token' cookie.
 * Adds user info (userId, roleId) to the request object if valid.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Checking for the 'token' in signed cookies
  const token = req.signedCookies.token;

  if (!token) {
    // If no token is present, denying access and redirecting to login
    return res.status(401).redirect('/login?error=unauthorized');
  }

  // Verifying the JWT token
  const payload = authService.verifyToken(token);

  if (!payload) {
    // If token is invalid or expired, clearing the cookie and denying access
    res.clearCookie('token');
    return res.status(401).redirect('/login?error=session_expired');
  }

  // Attaching the payload to the request for use in controllers
  req.user = payload;
  
  // Proceeding to the next middleware/route handler
  next();
};

/**
 * Authorizing a user based on their role ID.
 * @param allowedRoles An array of role IDs that are permitted to access the resource.
 */
export const authorize = (allowedRoles: UserRole[]) => {
  // Returning the authorization middleware function
  return (req: Request, res: Response, next: NextFunction) => {
    // Ensuring user data is available from the authenticate middleware
    if (!req.user) {
      // If authentication failed (shouldn't happen if authenticate runs first), denying access
      return res.status(403).json({ message: 'Authentication required.' });
    }

    // Checking if the user's role ID is in the list of allowed roles
    if (!allowedRoles.includes(req.user.roleId)) {
      // Denying access with a 403 Forbidden status
      return res.status(403).render('pages/error', {
          pageTitle: 'Access Denied',
          errorCode: 403,
          errorMessage: 'You do not have permission to access this resource.',
          isAuthenticated: !!req.user,
      });
    }
    
    // User is authorized, proceeding
    next();
  };
};