import type { Express, Response } from "express";
import { adminAuth, adminDb } from "../firebaseAdmin";
import { verifyToken, requireAdmin, requireRole } from "../middleware/auth";
import type { Employee } from "@shared/firestoreTypes";
import { z } from "zod";

const createEmployeeSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(["admin", "agent", "md"]),
  employeeId: z.string().optional(),
  branch: z.string().optional(),
  monthlyTarget: z.number().optional(),
});

const updateEmployeeSchema = z.object({
  displayName: z.string().optional(),
  phone: z.string().optional(),
  branch: z.string().optional(),
  monthlyTarget: z.number().optional(),
  isActive: z.boolean().optional(),
});

export function registerEmployeeRoutes(app: Express) {
  app.get("/api/employees", verifyToken, requireRole("admin", "md"), async (req: any, res: Response) => {
    try {
      const { role, isActive, branch } = req.query;
      
      let query = adminDb.collection("users");
      
      if (role) {
        query = query.where("role", "==", role) as any;
      }
      
      const snapshot = await query.get();
      let employees = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id,
      })) as Employee[];
      
      if (isActive !== undefined) {
        employees = employees.filter(emp => 
          emp.isActive === (isActive === 'true')
        );
      }
      
      if (branch) {
        employees = employees.filter(emp => emp.branch === branch);
      }
      
      for (const employee of employees) {
        const loansSnapshot = await adminDb.collection("loans")
          .where("agentId", "==", employee.uid)
          .get();
        
        employee.loansProcessed = loansSnapshot.size;
        employee.totalLoanAmount = loansSnapshot.docs.reduce((sum, doc) => {
          return sum + (doc.data().loanAmount || 0);
        }, 0);
        
        const clientsSnapshot = await adminDb.collection("clients")
          .where("assignedAgent", "==", employee.uid)
          .get();
        
        const totalClients = clientsSnapshot.size;
        const convertedClients = clientsSnapshot.docs.filter(doc => 
          doc.data().status === "converted"
        ).length;
        
        employee.conversionRate = totalClients > 0 
          ? Math.round((convertedClients / totalClients) * 100) 
          : 0;
      }
      
      res.json(employees);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/employees/:uid", verifyToken, async (req: any, res: Response) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "md" && req.user.uid !== req.params.uid) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const doc = await adminDb.collection("users").doc(req.params.uid).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      const employee = { ...doc.data(), uid: doc.id } as Employee;
      
      const loansSnapshot = await adminDb.collection("loans")
        .where("agentId", "==", employee.uid)
        .get();
      
      employee.loansProcessed = loansSnapshot.size;
      employee.totalLoanAmount = loansSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().loanAmount || 0);
      }, 0);
      
      res.json(employee);
    } catch (error: any) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/employees", verifyToken, requireAdmin, async (req: any, res: Response) => {
    try {
      const validatedData = createEmployeeSchema.parse(req.body);
      
      const userRecord = await adminAuth.createUser({
        email: validatedData.email,
        password: validatedData.password,
        displayName: validatedData.displayName,
      });
      
      await adminAuth.setCustomUserClaims(userRecord.uid, { role: validatedData.role });
      
      const employeeData = {
        uid: userRecord.uid,
        email: validatedData.email,
        displayName: validatedData.displayName,
        phone: validatedData.phone,
        role: validatedData.role,
        employeeId: validatedData.employeeId,
        branch: validatedData.branch,
        monthlyTarget: validatedData.monthlyTarget,
        isActive: true,
        loansProcessed: 0,
        totalLoanAmount: 0,
        conversionRate: 0,
        joinDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await adminDb.collection("users").doc(userRecord.uid).set(employeeData);
      
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      await adminDb.collection("audit_logs").add({
        userId: req.user.uid,
        userName: userData?.displayName || req.user.email,
        action: "created_employee",
        entityType: "employee",
        entityId: userRecord.uid,
        timestamp: new Date(),
      });
      
      res.status(201).json(employeeData);
    } catch (error: any) {
      console.error("Error creating employee:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/employees/:uid", verifyToken, requireAdmin, async (req: any, res: Response) => {
    try {
      const validatedData = updateEmployeeSchema.parse(req.body);
      
      const docRef = adminDb.collection("users").doc(req.params.uid);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      const updateData = {
        ...validatedData,
        updatedAt: new Date(),
      };
      
      await docRef.update(updateData);
      
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      await adminDb.collection("audit_logs").add({
        userId: req.user.uid,
        userName: userData?.displayName || req.user.email,
        action: "updated_employee",
        entityType: "employee",
        entityId: req.params.uid,
        changes: validatedData,
        timestamp: new Date(),
      });
      
      const updated = await docRef.get();
      res.json({ ...updated.data(), uid: updated.id });
    } catch (error: any) {
      console.error("Error updating employee:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/employees/:uid/performance", verifyToken, async (req: any, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      let loansQuery = adminDb.collection("loans")
        .where("agentId", "==", req.params.uid);
      
      if (startDate && endDate) {
        loansQuery = loansQuery
          .where("createdAt", ">=", new Date(startDate as string))
          .where("createdAt", "<=", new Date(endDate as string)) as any;
      }
      
      const loansSnapshot = await loansQuery.get();
      const loans = loansSnapshot.docs.map(doc => doc.data());
      
      const totalLoans = loans.length;
      const totalAmount = loans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
      const disbursedLoans = loans.filter(loan => loan.status === "active").length;
      
      let clientsQuery = adminDb.collection("clients")
        .where("assignedAgent", "==", req.params.uid);
      
      const clientsSnapshot = await clientsQuery.get();
      const clients = clientsSnapshot.docs.map(doc => doc.data());
      
      const totalClients = clients.length;
      const convertedClients = clients.filter(c => c.status === "converted").length;
      const conversionRate = totalClients > 0 ? (convertedClients / totalClients) * 100 : 0;
      
      res.json({
        totalLoans,
        totalAmount,
        disbursedLoans,
        totalClients,
        convertedClients,
        conversionRate: Math.round(conversionRate),
      });
    } catch (error: any) {
      console.error("Error fetching employee performance:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
