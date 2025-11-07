import type { Express, Response } from "express";
import { adminDb } from "../firebaseAdmin";
import { verifyToken, requireAdmin, requireRole } from "../middleware/auth";
import type { PolicyConfig } from "@shared/firestoreTypes";
import { z } from "zod";

const updatePolicySchema = z.object({
  highValueThresholds: z.object({
    loanAmount: z.number(),
    minInterestRate: z.number(),
    maxTenure: z.number(),
  }).optional(),
  topUpEligibilityMonths: z.number().optional(),
  attendanceGeoFenceRadius: z.number().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
});

export function registerPolicyRoutes(app: Express) {
  app.get("/api/policy", verifyToken, async (req: any, res: Response) => {
    try {
      const snapshot = await adminDb.collection("policy_config").limit(1).get();
      
      if (snapshot.empty) {
        const defaultPolicy: Omit<PolicyConfig, "id"> = {
          highValueThresholds: {
            loanAmount: 1000000,
            minInterestRate: 12,
            maxTenure: 60,
          },
          topUpEligibilityMonths: 12,
          attendanceGeoFenceRadius: 500,
          emailNotifications: true,
          smsNotifications: false,
          updatedBy: "system",
          updatedAt: new Date(),
        };
        
        const docRef = await adminDb.collection("policy_config").add(defaultPolicy);
        return res.json({ ...defaultPolicy, id: docRef.id });
      }
      
      const doc = snapshot.docs[0];
      res.json({ ...doc.data(), id: doc.id });
    } catch (error: any) {
      console.error("Error fetching policy:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/policy", verifyToken, requireRole("admin", "md"), async (req: any, res: Response) => {
    try {
      const validatedData = updatePolicySchema.parse(req.body);
      
      const snapshot = await adminDb.collection("policy_config").limit(1).get();
      
      let docRef;
      if (snapshot.empty) {
        const defaultPolicy: Omit<PolicyConfig, "id"> = {
          highValueThresholds: {
            loanAmount: 1000000,
            minInterestRate: 12,
            maxTenure: 60,
          },
          topUpEligibilityMonths: 12,
          attendanceGeoFenceRadius: 500,
          emailNotifications: true,
          smsNotifications: false,
          ...validatedData,
          updatedBy: req.user.uid,
          updatedAt: new Date(),
        };
        docRef = await adminDb.collection("policy_config").add(defaultPolicy);
      } else {
        docRef = snapshot.docs[0].ref;
        await docRef.update({
          ...validatedData,
          updatedBy: req.user.uid,
          updatedAt: new Date(),
        });
      }
      
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      await adminDb.collection("audit_logs").add({
        userId: req.user.uid,
        userName: userData?.displayName || req.user.email,
        action: "updated_policy",
        entityType: "policy",
        entityId: docRef.id,
        changes: validatedData,
        timestamp: new Date(),
      });
      
      const updated = await docRef.get();
      res.json({ ...updated.data(), id: updated.id });
    } catch (error: any) {
      console.error("Error updating policy:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/policy/high-value-thresholds", verifyToken, async (req: any, res: Response) => {
    try {
      const snapshot = await adminDb.collection("policy_config").limit(1).get();
      
      if (snapshot.empty) {
        return res.json({
          loanAmount: 1000000,
          minInterestRate: 12,
          maxTenure: 60,
        });
      }
      
      const policy = snapshot.docs[0].data();
      res.json(policy.highValueThresholds || {
        loanAmount: 1000000,
        minInterestRate: 12,
        maxTenure: 60,
      });
    } catch (error: any) {
      console.error("Error fetching high-value thresholds:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
