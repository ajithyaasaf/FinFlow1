import type { Express, Response } from "express";
import { adminDb } from "../firebaseAdmin";
import { createLoanSchema, updateLoanStageSchema } from "../lib/validation";
import { generateLoanNumber, calculateEMI } from "../lib/quotationLogic";
import type { Loan, LoanStageDetail, LoanStage } from "@shared/firestoreTypes";

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
  };
}

const STAGE_LABELS = {
  application_submitted: "Application Submitted",
  document_verification: "Document Verification",
  credit_appraisal: "Credit Appraisal",
  sanction: "Sanction",
  agreement_signed: "Agreement Signed",
  disbursement_ready: "Disbursement Ready",
};

function initializeLoanStages(): LoanStageDetail[] {
  return Object.entries(STAGE_LABELS).map(([stage, label]) => ({
    stage: stage as LoanStage,
    label,
    completed: false,
  }));
}

export function registerLoanRoutes(app: Express, verifyToken: any) {
  // GET /api/loans - Get all loans
  app.get("/api/loans", verifyToken, async (req: any, res: Response) => {
    try {
      const { status, agentId, clientId } = req.query;
      
      let query = adminDb.collection("loans").orderBy("createdAt", "desc");
      
      if (status) {
        query = query.where("status", "==", status) as any;
      }
      
      if (agentId) {
        query = query.where("agentId", "==", agentId) as any;
      }
      
      if (clientId) {
        query = query.where("clientId", "==", clientId) as any;
      }
      
      const snapshot = await query.limit(100).get();
      const loans = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Loan[];
      
      res.json(loans);
    } catch (error: any) {
      console.error("Error fetching loans:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/loans/:id - Get a single loan
  app.get("/api/loans/:id", verifyToken, async (req: any, res: Response) => {
    try {
      const doc = await adminDb.collection("loans").doc(req.params.id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Loan not found" });
      }
      
      res.json({ ...doc.data(), id: doc.id });
    } catch (error: any) {
      console.error("Error fetching loan:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/loans - Create a new loan (Admin only)
  app.post("/api/loans", verifyToken, async (req: any, res: Response) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can create loans" });
      }
      
      const validatedData = createLoanSchema.parse(req.body);
      
      // Get user profile
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      // Generate loan number
      const loanNumber = await generateLoanNumber();
      
      // Calculate EMI
      const emi = calculateEMI(
        validatedData.loanAmount,
        validatedData.interestRate,
        validatedData.tenure
      );
      
      // Calculate top-up eligible date (12 months from now by default)
      const topUpEligibleDate = new Date();
      topUpEligibleDate.setMonth(topUpEligibleDate.getMonth() + 12);
      
      // Initialize stages
      const stages = initializeLoanStages();
      
      const loanData: Omit<Loan, "id"> = {
        ...validatedData,
        loanNumber,
        agentId: req.user.uid,
        agentName: userData?.displayName || req.user.email || "Unknown",
        emi,
        currentStage: "application_submitted",
        stages,
        status: "active",
        topUpEligibleDate,
        topUpNotified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await adminDb.collection("loans").add(loanData);
      
      // Create audit log
      await adminDb.collection("audit_logs").add({
        userId: req.user.uid,
        userName: userData?.displayName || req.user.email,
        action: "created_loan",
        entityType: "loan",
        entityId: docRef.id,
        timestamp: new Date(),
      });
      
      res.status(201).json({ ...loanData, id: docRef.id });
    } catch (error: any) {
      console.error("Error creating loan:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // PATCH /api/loans/:id/stage - Update loan stage
  app.patch("/api/loans/:id/stage", verifyToken, async (req: any, res: Response) => {
    try {
      if (!["admin", "agent"].includes(req.user.role)) {
        return res.status(403).json({ error: "Unauthorized to update loan stages" });
      }
      
      const { stage, remarks, completed } = updateLoanStageSchema.parse(req.body);
      
      const docRef = adminDb.collection("loans").doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Loan not found" });
      }
      
      const loanData = doc.data() as Loan;
      const stages = [...loanData.stages];
      
      // Find and update the stage
      const stageIndex = stages.findIndex(s => s.stage === stage);
      if (stageIndex === -1) {
        return res.status(400).json({ error: "Invalid stage" });
      }
      
      stages[stageIndex] = {
        ...stages[stageIndex],
        completed,
        ...(completed ? { completedAt: new Date() } : {}),
        ...(remarks ? { remarks } : {}),
      };
      
      // Update current stage to the most recent completed stage or the first incomplete one
      let currentStage = stage;
      for (let i = stages.length - 1; i >= 0; i--) {
        if (stages[i].completed) {
          currentStage = stages[i].stage;
          break;
        }
      }
      
      await docRef.update({
        stages,
        currentStage,
        updatedAt: new Date(),
      });
      
      // Get user profile for audit log
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      // Create audit log
      await adminDb.collection("audit_logs").add({
        userId: req.user.uid,
        userName: userData?.displayName || req.user.email,
        action: "updated_loan_stage",
        entityType: "loan",
        entityId: req.params.id,
        changes: { stage, completed, remarks },
        timestamp: new Date(),
      });
      
      const updated = await docRef.get();
      res.json({ ...updated.data(), id: updated.id });
    } catch (error: any) {
      console.error("Error updating loan stage:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // PATCH /api/loans/:id/disburse - Mark loan as disbursed
  app.patch("/api/loans/:id/disburse", verifyToken, async (req: any, res: Response) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can disburse loans" });
      }
      
      const { disbursementAmount } = req.body;
      
      const docRef = adminDb.collection("loans").doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Loan not found" });
      }
      
      await docRef.update({
        disbursementDate: new Date(),
        disbursementAmount: disbursementAmount || doc.data()?.loanAmount,
        status: "active",
        updatedAt: new Date(),
      });
      
      const updated = await docRef.get();
      res.json({ ...updated.data(), id: updated.id });
    } catch (error: any) {
      console.error("Error disbursing loan:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/loans/topup-eligible - Get loans eligible for top-up
  app.get("/api/loans/topup-eligible", verifyToken, async (req: any, res: Response) => {
    try {
      const now = new Date();
      
      const snapshot = await adminDb.collection("loans")
        .where("status", "==", "active")
        .where("topUpEligibleDate", "<=", now)
        .where("topUpNotified", "==", false)
        .get();
      
      const loans = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Loan[];
      
      res.json(loans);
    } catch (error: any) {
      console.error("Error fetching top-up eligible loans:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
