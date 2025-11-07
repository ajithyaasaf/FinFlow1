import type { Express, Response } from "express";
import { adminDb } from "../firebaseAdmin";
import { verifyToken, requireAdmin, requireRole } from "../middleware/auth";
import { 
  createAttendanceSchema, 
  updateAttendanceSchema, 
  deleteAttendanceSchema 
} from "../lib/validation";
import type { Attendance } from "@shared/firestoreTypes";
import type { AuthRequest } from "../types";

export function registerAttendanceRoutes(app: Express) {
  // GET /api/attendance - Get all attendance records
  app.get("/api/attendance", verifyToken, async (req: any, res: Response) => {
    try {
      const { agentId, date, startDate, endDate } = req.query;
      
      let query = adminDb.collection("attendance")
        .where("isDeleted", "==", false)
        .orderBy("checkInTime", "desc");
      
      if (agentId) {
        query = query.where("agentId", "==", agentId) as any;
      }
      
      const snapshot = await query.limit(100).get();
      let attendance = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Attendance[];
      
      // Filter by date range if provided (client-side filtering)
      if (date) {
        const targetDate = new Date(date as string);
        attendance = attendance.filter(a => {
          const checkIn = a.checkInTime instanceof Date ? a.checkInTime : (a.checkInTime as any).toDate();
          return checkIn.toDateString() === targetDate.toDateString();
        });
      } else if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        attendance = attendance.filter(a => {
          const checkIn = a.checkInTime instanceof Date ? a.checkInTime : (a.checkInTime as any).toDate();
          return checkIn >= start && checkIn <= end;
        });
      }
      
      res.json(attendance);
    } catch (error: any) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/attendance/:id - Get a single attendance record
  app.get("/api/attendance/:id", verifyToken, async (req: any, res: Response) => {
    try {
      const doc = await adminDb.collection("attendance").doc(req.params.id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Attendance record not found" });
      }
      
      res.json({ ...doc.data(), id: doc.id });
    } catch (error: any) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/attendance - Create attendance record (Agent or Admin)
  app.post("/api/attendance", verifyToken, async (req: any, res: Response) => {
    try {
      if (!["agent", "admin"].includes(req.user.role)) {
        return res.status(403).json({ error: "Unauthorized to mark attendance" });
      }
      
      const { workDescription, latitude, longitude, address } = createAttendanceSchema.parse(req.body);
      const { selfieUrl } = req.body; // This should come from a previous file upload
      
      if (!selfieUrl) {
        return res.status(400).json({ error: "Selfie URL is required" });
      }
      
      // Get user profile
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      const attendanceData: Omit<Attendance, "id"> = {
        agentId: req.user.uid,
        agentName: userData?.displayName || req.user.email || "Unknown",
        checkInTime: new Date(),
        selfieUrl,
        location: {
          latitude,
          longitude,
          address,
        },
        workDescription,
        isDeleted: false,
        createdAt: new Date(),
      };
      
      const docRef = await adminDb.collection("attendance").add(attendanceData);
      
      // Create audit log
      await adminDb.collection("audit_logs").add({
        userId: req.user.uid,
        userName: userData?.displayName || req.user.email,
        action: "created_attendance",
        entityType: "attendance",
        entityId: docRef.id,
        timestamp: new Date(),
      });
      
      res.status(201).json({ ...attendanceData, id: docRef.id });
    } catch (error: any) {
      console.error("Error creating attendance:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // PATCH /api/attendance/:id - Edit attendance (Admin only)
  app.patch("/api/attendance/:id", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      
      const validatedData = updateAttendanceSchema.parse(req.body);
      
      const docRef = adminDb.collection("attendance").doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Attendance record not found" });
      }
      
      const updateData: any = {
        editedBy: req.user.uid,
        editedAt: new Date(),
        editReason: validatedData.editReason,
      };
      
      if (validatedData.workDescription) {
        updateData.workDescription = validatedData.workDescription;
      }
      
      if (validatedData.location) {
        updateData.location = validatedData.location;
      }
      
      await docRef.update(updateData);
      
      // Get user profile for audit log
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      // Create audit log
      await adminDb.collection("audit_logs").add({
        userId: req.user.uid,
        userName: userData?.displayName || req.user.email,
        action: "edited_attendance",
        entityType: "attendance",
        entityId: req.params.id,
        changes: validatedData,
        timestamp: new Date(),
      });
      
      const updated = await docRef.get();
      res.json({ ...updated.data(), id: updated.id });
    } catch (error: any) {
      console.error("Error editing attendance:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/attendance/:id - Soft delete attendance (Admin only)
  app.delete("/api/attendance/:id", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      
      const { deleteReason } = deleteAttendanceSchema.parse(req.body);
      
      const docRef = adminDb.collection("attendance").doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Attendance record not found" });
      }
      
      await docRef.update({
        isDeleted: true,
        deletedBy: req.user.uid,
        deletedAt: new Date(),
        deleteReason,
      });
      
      // Get user profile for audit log
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      // Create audit log
      await adminDb.collection("audit_logs").add({
        userId: req.user.uid,
        userName: userData?.displayName || req.user.email,
        action: "deleted_attendance",
        entityType: "attendance",
        entityId: req.params.id,
        changes: { deleteReason },
        timestamp: new Date(),
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting attendance:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/attendance/stats/today - Get today's attendance stats
  app.get("/api/attendance/stats/today", verifyToken, async (req: any, res: Response) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const snapshot = await adminDb.collection("attendance")
        .where("isDeleted", "==", false)
        .where("checkInTime", ">=", today)
        .where("checkInTime", "<", tomorrow)
        .get();
      
      const total = snapshot.size;
      
      // Get unique agents
      const uniqueAgents = new Set(snapshot.docs.map(doc => doc.data().agentId));
      const present = uniqueAgents.size;
      
      res.json({ total, present });
    } catch (error: any) {
      console.error("Error fetching attendance stats:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
