import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { adminAuth, adminDb } from "./firebaseAdmin";
import { verifyToken, requireAdmin } from "./middleware/auth";
import type { AuthRequest } from "./types";

export async function registerRoutes(app: Express): Promise<Server> {

  // POST /api/users/create - Create user with role (Admin only)
  app.post("/api/users/create", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
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
  app.post("/api/users/set-role", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
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
  clientRoutes.registerClientRoutes(app);

  // Import quotation routes
  const quotationRoutes = await import("./routes/quotations");
  quotationRoutes.registerQuotationRoutes(app);

  // Import loan routes
  const loanRoutes = await import("./routes/loans");
  loanRoutes.registerLoanRoutes(app);

  // Import attendance routes
  const attendanceRoutes = await import("./routes/attendance");
  attendanceRoutes.registerAttendanceRoutes(app);

  // Import file upload routes
  const uploadRoutes = await import("./routes/uploads");
  uploadRoutes.registerUploadRoutes(app);
  
  // Import document routes
  const documentRoutes = await import("./routes/documents");
  documentRoutes.registerDocumentRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
