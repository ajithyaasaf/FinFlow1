import type { Request, Response, NextFunction } from "express";
import { adminAuth } from "../firebaseAdmin";
import type { AuthRequest } from "../types";

/**
 * Type guard to check if request has been authenticated
 */
export function isAuthRequest(req: Request): req is AuthRequest {
  return 'user' in req && typeof (req as any).user?.uid === 'string';
}

/**
 * Middleware to verify Firebase ID token and attach user to request
 * Ensures all protected routes have authenticated user context
 * After this middleware, request can be safely cast to AuthRequest
 */
export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.headers.authorization?.split("Bearer ")[1];
  
  if (!token) {
    res.status(401).json({ error: "Unauthorized - No token provided" });
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Attach user info to request (mutate to AuthRequest)
    (req as AuthRequest).user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || "agent", // Default role
    };
    
    next();
  } catch (error: any) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    
    if (!authReq.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    if (!roles.includes(authReq.user.role || "")) {
      res.status(403).json({ 
        error: `Forbidden - Requires one of: ${roles.join(", ")}` 
      });
      return;
    }
    
    next();
  };
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthRequest;
  
  if (!authReq.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  
  if (authReq.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden - Admin access required" });
    return;
  }
  
  next();
}
