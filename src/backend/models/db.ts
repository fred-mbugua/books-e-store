import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { QueryResult } from 'pg';

// Loading environment variables
dotenv.config();

// Creating the pool for database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

// Logging a successful connection
pool.on('connect', () => {
  console.log('Connecting to PostgreSQL database');
});

// Logging connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Exiting the process on a critical database error
  process.exit(1);
});

/**
 * Executing a SQL query using the connection pool.
 * @param text The SQL query string.
 * @param params Optional array of query parameters.
 * @returns The query result.
 */
export const query = (text: string, params?: any[]): Promise<QueryResult> => {
  // Executing a SQL query with parameters
  return pool.query(text, params);
};

// Exporting the pool for transactions if needed
export default pool;