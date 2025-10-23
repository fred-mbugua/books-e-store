import * as express from 'express';
// Importing User type interface
import { User } from './index'; 

declare global {
  namespace Express {
    // This interface merges with the existing Express.Request interface
    interface Request {
      // The 'user' property holds the authenticated user object assuming user object matches the 'User' interface.
      user?: User; 
    }
  }
}