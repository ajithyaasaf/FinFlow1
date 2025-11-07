import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { adminAuth, adminDb } from "./firebaseAdmin";

// Extend Express Request to include user
interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to verify Firebase token and attach user to request
  const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split("Bearer ")[1];
    
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role,
      };
      next();
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };

  // POST /api/users/create - Create user with role (Admin only)
  app.post("/api/users/create", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
      // Check if requester is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Only admins can create users" });
      }

      const { email, password, displayName, role } = req.body;

      // Create user in Firebase Auth
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName,
      });

      // Set custom claims for role
      await adminAuth.setCustomUserClaims(userRecord.uid, { role });

      // Create user profile in Firestore
      await adminDb.collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        displayName,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.json({ uid: userRecord.uid, email, role });
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/users/set-role - Update user role (Admin only)
  app.post("/api/users/set-role", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
      // Check if requester is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Only admins can set roles" });
      }

      const { uid, role } = req.body;

      // Set custom claims
      await adminAuth.setCustomUserClaims(uid, { role });

      // Update Firestore
      await adminDb.collection("users").doc(uid).update({
        role,
        updatedAt: new Date(),
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error setting role:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/auth/register - Register new user (creates as agent by default, admin must upgrade)
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, displayName } = req.body;

      // Create user in Firebase Auth
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName,
      });

      // Set default role as agent
      await adminAuth.setCustomUserClaims(userRecord.uid, { role: "agent" });

      // Create user profile in Firestore
      await adminDb.collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        displayName,
        role: "agent",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.json({ uid: userRecord.uid, email, role: "agent" });
    } catch (error: any) {
      console.error("Error registering user:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Import client routes
  const clientRoutes = await import("./routes/clients");
  clientRoutes.registerClientRoutes(app, verifyToken);

  // Import quotation routes
  const quotationRoutes = await import("./routes/quotations");
  quotationRoutes.registerQuotationRoutes(app, verifyToken);

  // Import loan routes
  const loanRoutes = await import("./routes/loans");
  loanRoutes.registerLoanRoutes(app, verifyToken);

  // Import attendance routes
  const attendanceRoutes = await import("./routes/attendance");
  attendanceRoutes.registerAttendanceRoutes(app, verifyToken);

  // Import file upload routes
  const uploadRoutes = await import("./routes/uploads");
  uploadRoutes.registerUploadRoutes(app, verifyToken);

  const httpServer = createServer(app);
  return httpServer;
}
