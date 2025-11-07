import type { Express, Response } from "express";
import { adminDb } from "../firebaseAdmin";
import { verifyToken, requireAdmin } from "../middleware/auth";
import type { Notification } from "@shared/firestoreTypes";
import { z } from "zod";

const createNotificationSchema = z.object({
  userId: z.string().optional(),
  type: z.enum(["top_up", "high_value_quotation", "loan_stage_update", "attendance", "general"]),
  title: z.string(),
  message: z.string(),
  relatedId: z.string().optional(),
  relatedType: z.enum(["loan", "quotation", "client", "attendance"]).optional(),
});

export function registerNotificationRoutes(app: Express) {
  app.get("/api/notifications", verifyToken, async (req: any, res: Response) => {
    try {
      const { unreadOnly } = req.query;
      
      let query = adminDb.collection("notifications")
        .where("userId", "==", req.user.uid)
        .orderBy("createdAt", "desc");
      
      if (unreadOnly === "true") {
        query = query.where("read", "==", false) as any;
      }
      
      const snapshot = await query.limit(50).get();
      const notifications = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Notification[];
      
      res.json(notifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/notifications/unread-count", verifyToken, async (req: any, res: Response) => {
    try {
      const snapshot = await adminDb.collection("notifications")
        .where("userId", "==", req.user.uid)
        .where("read", "==", false)
        .get();
      
      res.json({ count: snapshot.size });
    } catch (error: any) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notifications", verifyToken, requireAdmin, async (req: any, res: Response) => {
    try {
      const validatedData = createNotificationSchema.parse(req.body);
      
      const notificationData: Omit<Notification, "id"> = {
        userId: validatedData.userId || req.user.uid,
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        read: false,
        relatedId: validatedData.relatedId,
        relatedType: validatedData.relatedType,
        createdAt: new Date(),
      };
      
      const docRef = await adminDb.collection("notifications").add(notificationData);
      
      res.status(201).json({ ...notificationData, id: docRef.id });
    } catch (error: any) {
      console.error("Error creating notification:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/notifications/:id/read", verifyToken, async (req: any, res: Response) => {
    try {
      const docRef = adminDb.collection("notifications").doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      const notification = doc.data();
      if (notification?.userId !== req.user.uid) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await docRef.update({
        read: true,
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notifications/mark-all-read", verifyToken, async (req: any, res: Response) => {
    try {
      const snapshot = await adminDb.collection("notifications")
        .where("userId", "==", req.user.uid)
        .where("read", "==", false)
        .get();
      
      const batch = adminDb.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      
      await batch.commit();
      
      res.json({ success: true, count: snapshot.size });
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/notifications/:id", verifyToken, async (req: any, res: Response) => {
    try {
      const docRef = adminDb.collection("notifications").doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      const notification = doc.data();
      if (notification?.userId !== req.user.uid && req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await docRef.delete();
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notifications/broadcast", verifyToken, requireAdmin, async (req: any, res: Response) => {
    try {
      const { role, title, message, type = "general" } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ error: "Title and message are required" });
      }
      
      let usersQuery = adminDb.collection("users");
      
      if (role) {
        usersQuery = usersQuery.where("role", "==", role) as any;
      }
      
      const usersSnapshot = await usersQuery.get();
      
      const batch = adminDb.batch();
      let count = 0;
      
      usersSnapshot.docs.forEach(userDoc => {
        const notificationRef = adminDb.collection("notifications").doc();
        batch.set(notificationRef, {
          userId: userDoc.id,
          type,
          title,
          message,
          read: false,
          createdAt: new Date(),
        });
        count++;
      });
      
      await batch.commit();
      
      res.json({ success: true, count });
    } catch (error: any) {
      console.error("Error broadcasting notification:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
