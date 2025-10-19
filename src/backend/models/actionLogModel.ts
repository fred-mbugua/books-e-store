import { query } from './db';
import { logger } from '../utils';

interface ActionLog {
  userId?: string;
  actionType: string;
  details: Record<string, any>;
}

/**
 * Storing an action log in the database.
 * @param logData The data for the action log.
 */
export const createActionLog = async (logData: ActionLog) => {
  const { userId, actionType, details } = logData;
  const sql = `
    INSERT INTO action_logs (user_id, action_type, details)
    VALUES ($1, $2, $3::jsonb)
    RETURNING log_id;
  `;
  const params = [userId || null, actionType, JSON.stringify(details)];

  try {
    // Executing the query to insert the action log
    await query(sql, params);
  } catch (error) {
    // Logging critical error if action log insertion fails
    logger.error('Failed to insert action log:', error);
    // Note: We avoid throwing here to prevent cascading failures if the log itself fails
  }
};