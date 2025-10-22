import { query } from './db';
import { User } from '../types';

/**
 * Finding a user by their email address.
 * @param email The user's email.
 * @returns The user object or null.
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  // Querying the database for a user matching the provided email
  const sql = 'SELECT * FROM users WHERE email = $1';
  const result = await query(sql, [email]);
  // Returning the first user found or null
  return result.rows[0] || null;
};

/**
 * Creating a new user record in the database.
 * @param userData User data including hashed password and role ID.
 * @returns The ID of the newly created user.
 */
export const createUser = async (userData: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  roleId: number;
}): Promise<string> => {
  // Inserting a new user record
  const sql = `
    INSERT INTO users (email, password_hash, first_name, last_name, role_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING user_id;
  `;
  const params = [
    userData.email,
    userData.passwordHash,
    userData.firstName,
    userData.lastName,
    userData.roleId,
  ];

  const result = await query(sql, params);
  // Returning the ID of the new user
  return result.rows[0].user_id;
};

/**
 * Finding a user by their user ID.
 * @param userId The user's UUID.
 * @returns The user object or null.
 */
export const findUserById = async (userId: string): Promise<User | null> => {
    // Querying the database for a user matching the provided ID
    const sql = 'SELECT * FROM users WHERE user_id = $1';
    const result = await query(sql, [userId]);
    // Returning the user object
    return result.rows[0] || null;
};