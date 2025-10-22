// Defining the structure for user data retrieved from the database
export interface User {
  user_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role_id: number;
  created_at: Date;
  updated_at: Date;
}

// Defining the payload structure for the JSON Web Token
export interface JwtPayload {
  userId: string;
  roleId: number;
  // Adding the standard expiration time claim
  exp?: number; 
}

// Defining the roles enum for easy access and comparison
export enum UserRole {
  Admin = 1,
  ShopKeeper = 2,
  Customer = 3,
}