import type { Express, Response } from "express";
import { adminDb, adminStorage } from "../firebaseAdmin";
import { verifyToken, requireAdmin, requireRole } from "../middleware/auth";
import type { Payroll, PayrollComponent } from "@shared/firestoreTypes";
import { z } from "zod";
import { generatePayslipPDF } from "../lib/pdfGenerator";

const componentSchema = z.object({
  name: z.string(),
  amount: z.number(),
  type: z.enum(["earning", "deduction"]),
});

const createPayrollSchema = z.object({
  employeeId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number(),
  basicSalary: z.number(),
  components: z.array(componentSchema),
  notes: z.string().optional(),
});

const updatePayrollSchema = z.object({
  basicSalary: z.number().optional(),
  components: z.array(componentSchema).optional(),
  notes: z.string().optional(),
});

export function registerPayrollRoutes(app: Express) {
  app.get("/api/payroll", verifyToken, requireRole("admin", "md"), async (req: any, res: Response) => {
    try {
      const { employeeId, month, year, status } = req.query;
      
      let query = adminDb.collection("payroll").orderBy("createdAt", "desc");
      
      if (employeeId) {
        query = query.where("employeeId", "==", employeeId) as any;
      }
      
      if (month) {
        query = query.where("month", "==", parseInt(month as string)) as any;
      }
      
      if (year) {
        query = query.where("year", "==", parseInt(year as string)) as any;
      }
      
      if (status) {
        query = query.where("status", "==", status) as any;
      }
      
      const snapshot = await query.limit(100).get();
      const payrolls = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Payroll[];
      
      res.json(payrolls);
    } catch (error: any) {
      console.error("Error fetching payroll:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/payroll/:id", verifyToken, async (req: any, res: Response) => {
    try {
      const doc = await adminDb.collection("payroll").doc(req.params.id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Payroll record not found" });
      }
      
      const payroll = { ...doc.data(), id: doc.id };
      
      if (req.user.role !== "admin" && req.user.role !== "md") {
        if (payroll.employeeId !== req.user.uid) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      res.json(payroll);
    } catch (error: any) {
      console.error("Error fetching payroll:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll", verifyToken, requireAdmin, async (req: any, res: Response) => {
    try {
      const validatedData = createPayrollSchema.parse(req.body);
      
      const employeeDoc = await adminDb.collection("users").doc(validatedData.employeeId).get();
      if (!employeeDoc.exists) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      const employee = employeeDoc.data() as any;
      
      const startDate = new Date(validatedData.year, validatedData.month - 1, 1);
      const endDate = new Date(validatedData.year, validatedData.month, 0);
      
      const attendanceSnapshot = await adminDb.collection("attendance")
        .where("agentId", "==", validatedData.employeeId)
        .where("checkInTime", ">=", startDate)
        .where("checkInTime", "<=", endDate)
        .where("isDeleted", "==", false)
        .get();
      
      const daysPresent = attendanceSnapshot.size;
      const totalWorkingDays = new Date(validatedData.year, validatedData.month, 0).getDate();
      const daysAbsent = totalWorkingDays - daysPresent;
      
      const earnings = validatedData.components.filter(c => c.type === "earning");
      const deductions = validatedData.components.filter(c => c.type === "deduction");
      
      const grossSalary = validatedData.basicSalary + earnings.reduce((sum, e) => sum + e.amount, 0);
      const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
      const netSalary = grossSalary - totalDeductions;
      
      const payrollData: Omit<Payroll, "id"> = {
        employeeId: validatedData.employeeId,
        employeeName: employee?.displayName || "Unknown",
        employeeEmail: employee?.email || "",
        month: validatedData.month,
        year: validatedData.year,
        totalWorkingDays,
        daysPresent,
        daysAbsent,
        basicSalary: validatedData.basicSalary,
        components: validatedData.components,
        grossSalary,
        totalDeductions,
        netSalary,
        status: "draft",
        notes: validatedData.notes,
        createdBy: req.user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await adminDb.collection("payroll").add(payrollData);
      
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      await adminDb.collection("audit_logs").add({
        userId: req.user.uid,
        userName: userData?.displayName || req.user.email,
        action: "created_payroll",
        entityType: "payroll",
        entityId: docRef.id,
        timestamp: new Date(),
      });
      
      res.status(201).json({ ...payrollData, id: docRef.id });
    } catch (error: any) {
      console.error("Error creating payroll:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/payroll/:id", verifyToken, requireAdmin, async (req: any, res: Response) => {
    try {
      const validatedData = updatePayrollSchema.parse(req.body);
      
      const docRef = adminDb.collection("payroll").doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Payroll record not found" });
      }
      
      const currentData = doc.data();
      
      let updateData: any = {
        ...validatedData,
        updatedAt: new Date(),
      };
      
      if (validatedData.basicSalary || validatedData.components) {
        const basicSalary = validatedData.basicSalary || currentData?.basicSalary || 0;
        const components = validatedData.components || currentData?.components || [];
        
        const earnings = components.filter((c: PayrollComponent) => c.type === "earning");
        const deductions = components.filter((c: PayrollComponent) => c.type === "deduction");
        
        updateData.grossSalary = basicSalary + earnings.reduce((sum: number, e: any) => sum + e.amount, 0);
        updateData.totalDeductions = deductions.reduce((sum: number, d: any) => sum + d.amount, 0);
        updateData.netSalary = updateData.grossSalary - updateData.totalDeductions;
      }
      
      await docRef.update(updateData);
      
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      
      await adminDb.collection("audit_logs").add({
        userId: req.user.uid,
        userName: userData?.displayName || req.user.email,
        action: "updated_payroll",
        entityType: "payroll",
        entityId: req.params.id,
        changes: validatedData,
        timestamp: new Date(),
      });
      
      const updated = await docRef.get();
      res.json({ ...updated.data(), id: updated.id });
    } catch (error: any) {
      console.error("Error updating payroll:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll/:id/approve", verifyToken, requireAdmin, async (req: any, res: Response) => {
    try {
      const docRef = adminDb.collection("payroll").doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Payroll record not found" });
      }
      
      await docRef.update({
        status: "approved",
        approvedBy: req.user.uid,
        approvedAt: new Date(),
        updatedAt: new Date(),
      });
      
      const updated = await docRef.get();
      res.json({ ...updated.data(), id: updated.id });
    } catch (error: any) {
      console.error("Error approving payroll:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll/:id/generate-payslip", verifyToken, requireAdmin, async (req: any, res: Response) => {
    try {
      const payrollDoc = await adminDb.collection("payroll").doc(req.params.id).get();
      
      if (!payrollDoc.exists) {
        return res.status(404).json({ error: "Payroll record not found" });
      }
      
      const payroll = payrollDoc.data();
      
      const employeeDoc = await adminDb.collection("users").doc(payroll?.employeeId).get();
      const employee = employeeDoc.data();
      
      const pdf = generatePayslipPDF(payroll, employee);
      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
      
      const fileName = `payslips/${payroll?.employeeId}/${payroll?.year}-${String(payroll?.month).padStart(2, '0')}.pdf`;
      const bucket = adminStorage.bucket();
      const file = bucket.file(fileName);
      
      await file.save(pdfBuffer, {
        contentType: 'application/pdf',
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });
      
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
      
      await adminDb.collection("payroll").doc(req.params.id).update({
        payslipUrl: fileName,
        updatedAt: new Date(),
      });
      
      res.json({ url, path: fileName });
    } catch (error: any) {
      console.error("Error generating payslip:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
