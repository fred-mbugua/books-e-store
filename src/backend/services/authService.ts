import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userModel, actionLogModel } from '../models';
import { User, JwtPayload, UserRole } from '../types';
import { logger } from '../utils';

const saltRounds = 10;
const jwtSecret = process.env.JWT_SECRET!;
const jwtExpiresIn = '7d';

/**
 * Hashing the plain text password.
 * @param password The user's plain password.
 * @returns The hashed password string.
 */
const hashPassword = (password: string): Promise<string> => {
  // Hashing the password using bcrypt
  return bcrypt.hash(password, saltRounds);
};

/**
 * Comparing a plain text password with a hashed password.
 * @param password The plain text password.
 * @param hash The stored hash.
 * @returns True if passwords match, false otherwise.
 */
const comparePassword = (password: string, hash: string): Promise<boolean> => {
  // Comparing the provided password with the stored hash
  return bcrypt.compare(password, hash);
};

/**
 * Generating a JWT for authentication.
 * @param userId The ID of the authenticated user.
 * @param roleId The role ID of the user.
 * @returns The signed JWT string.
 */
const generateToken = (userId: string, roleId: number): string => {
  const payload: JwtPayload = { userId, roleId };
  // Signing the JWT payload
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
};

/**
 * Verifying a JWT.
 * @param token The JWT string.
 * @returns The decoded payload or null if invalid.
 */
export const verifyToken = (token: string): JwtPayload | null => {
    try {
        // Verifying the JWT signature and expiration
        return jwt.verify(token, jwtSecret) as JwtPayload;
    } catch (error) {
        // Logging token verification failure
        logger.warn('JWT verification failed:', (error as Error).message);
        return null;
    }
};

/**
 * Registering a new customer user.
 * @param data Registration details.
 * @returns The generated JWT token.
 */
export const registerUser = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<string> => {
  // Checking if a user with this email already exists
  const existingUser = await userModel.findUserByEmail(data.email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hashing the user's password
  const passwordHash = await hashPassword(data.password);
  
  // Defining the role ID for a new customer
  const roleId = UserRole.Customer;

  // Creating the new user in the database
  const userId = await userModel.createUser({
    ...data,
    passwordHash,
    roleId,
  });

  // Generating a JWT for the new user
  const token = generateToken(userId, roleId);

  // Storing an action log for user registration
  await actionLogModel.createActionLog({
    userId,
    actionType: 'USER_REGISTERED',
    details: { email: data.email, roleId, registrationMethod: 'web' },
  });
  
  // Returning the authentication token
  return token;
};

/**
 * Logging in a user.
 * @param email The user's email.
 * @param password The user's password.
 * @returns The generated JWT token and user role ID.
 */
export const loginUser = async (email: string, password: string): Promise<{ token: string; roleId: number }> => {
  // Finding the user by email
  const user = await userModel.findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Comparing the provided password with the stored hash
  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // Generating a JWT for the authenticated user
  const token = generateToken(user.user_id, user.role_id);
  
  // Storing an action log for user login
  await actionLogModel.createActionLog({
    userId: user.user_id,
    actionType: 'USER_LOGIN',
    details: { email: user.email },
  });

  const userData = { token, roleId: user.role_id, userData: { userId: user.user_id, firstName: user.first_name, roleId: user.role_id }  };
  // Returning the token and role ID
  return userData;
 };