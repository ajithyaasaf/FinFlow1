import type { Express, Response } from "express";
import { adminDb } from "../firebaseAdmin";
import { verifyToken, requireAdmin, requireRole } from "../middleware/auth";
import { createQuotationSchema, updateQuotationSchema } from "../lib/validation";
import { 
  generateQuotationNumber, 
  checkHighValueQuotation, 
  calculateEMI 
} from "../lib/quotationLogic";
import type { Quotation } from "@shared/firestoreTypes";
import type { AuthRequest } from "../types";

export function registerQuotationRoutes(app: Express) {
  // GET /api/quotations - Get all quotations
  app.get("/api/quotations", verifyToken, async (req: any, res: Response) => {
    try {
      const { status, agentId, isHighValue } = req.query;
      
      let query = adminDb.collection("quotations").orderBy("createdAt", "desc");
      
      // Filter by status if provided
      if (status && status !== "all") {
        query = query.where("status", "==", status) as any;
      }
      
      // Filter by agent if provided
      if (agentId) {
        query = query.where("agentId", "==", agentId) as any;
      }
      
      // Filter by high-value flag
      if (isHighValue === "true") {
        query = query.where("isHighValue", "==", true) as any;
      }
      
      const snapshot = await query.limit(100).get();
      const quotations = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Quotation[];
      
      res.json(quotations);
    } catch (error: any) {
      console.error("Error fetching quotations:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/quotations/:id - Get a single quotation
  app.get("/api/quotations/:id", verifyToken, async (req: any, res: Response) => {
    try {
      const doc = await adminDb.collection("quotations").doc(req.params.id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Quotation not found" });
      }
      
      res.json({ ...doc.data(), id: doc.id });
    } catch (error: any) {
      console.error("Error fetching quotation:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/quotations - Create a new quotation
  app.post("/api/quotations", verifyToken, async (req: any, res: Response) => {
    try {
      // Only agents and admins can create quotations
      if (!["agent", "admin"].includes(req.user.role)) {
        return res.status(403).json({ error: "Unauthorized to create quotations" });
      }
      
      // Validate request body
      const validatedData = createQuotationSchema.parse(req.body);
      
      // Get user profile
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      // Generate quotation number
      const quotationNumber = await generateQuotationNumber();
      
      // Calculate EMI
      const emi = calculateEMI(
        validatedData.loanAmount,
        validatedData.interestRate,
        validatedData.tenure
      );
      
      // Check if high-value
      const { isHighValue, reasons } = await checkHighValueQuotation(
        validatedData.loanAmount,
        validatedData.interestRate,
        validatedData.tenure
      );
      
      const quotationData: Omit<Quotation, "id"> = {
        ...validatedData,
        quotationNumber,
        agentId: req.user.uid,
        agentName: userData?.displayName || req.user.email || "Unknown",
        emi,
        isHighValue,
        highValueReasons: isHighValue ? reasons : undefined,
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await adminDb.collection("quotations").add(quotationData);
      
      // Create audit log
      await adminDb.collection("audit_logs").add({
        userId: req.user.uid,
        userName: userData?.displayName || req.user.email,
        action: "created_quotation",
        entityType: "quotation",
        entityId: docRef.id,
        timestamp: new Date(),
      });
      
      // If high-value, create notification for admin and MD
      if (isHighValue) {
        const adminsSnapshot = await adminDb.collection("users")
          .where("role", "in", ["admin", "md"])
          .get();
        
        for (const adminDoc of adminsSnapshot.docs) {
          await adminDb.collection("notifications").add({
            userId: adminDoc.id,
            type: "high_value_quotation",
            title: "High-Value Quotation Created",
            message: `${userData?.displayName} created a high-value quotation for ₹${validatedData.loanAmount.toLocaleString('en-IN')}`,
            read: false,
            relatedId: docRef.id,
            relatedType: "quotation",
            createdAt: new Date(),
          });
        }
      }
      
      res.status(201).json({ ...quotationData, id: docRef.id });
    } catch (error: any) {
      console.error("Error creating quotation:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // PATCH /api/quotations/:id - Update a quotation
  app.patch("/api/quotations/:id", verifyToken, async (req: any, res: Response) => {
    try {
      const validatedData = updateQuotationSchema.parse(req.body);
      
      const docRef = adminDb.collection("quotations").doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Quotation not found" });
      }
      
      // Recalculate EMI if loan details changed
      let updateData: any = {
        ...validatedData,
        updatedAt: new Date(),
      };
      
      if (validatedData.loanAmount || validatedData.interestRate || validatedData.tenure) {
        const currentData = doc.data();
        const loanAmount = validatedData.loanAmount || currentData?.loanAmount;
        const interestRate = validatedData.interestRate || currentData?.interestRate;
        const tenure = validatedData.tenure || currentData?.tenure;
        
        updateData.emi = calculateEMI(loanAmount, interestRate, tenure);
        
        // Re-check high-value status
        const { isHighValue, reasons } = await checkHighValueQuotation(
          loanAmount,
          interestRate,
          tenure
        );
        updateData.isHighValue = isHighValue;
        updateData.highValueReasons = isHighValue ? reasons : undefined;
      }
      
      await docRef.update(updateData);
      
      // Get user profile for audit log
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      // Create audit log
      await adminDb.collection("audit_logs").add({
        userId: req.user.uid,
        userName: userData?.displayName || req.user.email,
        action: "updated_quotation",
        entityType: "quotation",
        entityId: req.params.id,
        changes: validatedData,
        timestamp: new Date(),
      });
      
      const updated = await docRef.get();
      res.json({ ...updated.data(), id: updated.id });
    } catch (error: any) {
      console.error("Error updating quotation:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // PATCH /api/quotations/:id/status - Update quotation status
  app.patch("/api/quotations/:id/status", verifyToken, async (req: any, res: Response) => {
    try {
      const { status } = req.body;
      
      if (!["draft", "finalized", "sent", "accepted", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const docRef = adminDb.collection("quotations").doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Quotation not found" });
      }
      
      await docRef.update({
        status,
        updatedAt: new Date(),
        ...(status === "sent" ? { sentAt: new Date() } : {}),
      });
      
      const updated = await docRef.get();
      res.json({ ...updated.data(), id: updated.id });
    } catch (error: any) {
      console.error("Error updating quotation status:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/quotations/:id - Delete a quotation (Admin only)
  app.delete("/api/quotations/:id", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      
      const docRef = adminDb.collection("quotations").doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Quotation not found" });
      }
      
      await docRef.delete();
      
      // Get user profile for audit log
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      // Create audit log
      await adminDb.collection("audit_logs").add({
        userId: req.user.uid,
        userName: userData?.displayName || req.user.email,
        action: "deleted_quotation",
        entityType: "quotation",
        entityId: req.params.id,
        timestamp: new Date(),
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting quotation:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
