import type { Request, Response, NextFunction } from "express";

/**
 * Extended Express Request with authenticated user information
 * Only available after verifyToken middleware has run
 */
export interface AuthRequest extends Request {
  user: {
    uid: string;
    email?: string;
    role: string; // Always present after auth (defaults to "agent")
  };
}

/**
 * Type for route handlers that require authentication
 */
export type AuthRouteHandler = (
  req: AuthRequest,
  res: Response,
  next?: NextFunction
) => Promise<void> | void;

/**
 * Type for middleware functions
 */
export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export type AuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;
