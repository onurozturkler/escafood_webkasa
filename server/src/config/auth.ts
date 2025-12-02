import { Request } from 'express';
import { DEV_USER_ID } from './devUser';

/**
 * Extract user ID from request
 * In dev environment, returns DEV_USER_ID
 * TODO: Replace with real auth middleware when authentication is implemented
 */
export function getUserId(req: Request): string {
  // For now, always return DEV_USER_ID in dev environment
  // TODO: Extract from JWT token or session when auth is implemented
  return DEV_USER_ID;
}

