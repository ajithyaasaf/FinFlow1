import type { Express, Response } from "express";
import { adminDb } from "../firebaseAdmin";
import { verifyToken, requireRole } from "../middleware/auth";

export function registerReportRoutes(app: Express) {
  app.get("/api/reports/dashboard-stats", verifyToken, async (req: any, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      const loansSnapshot = await adminDb.collection("loans")
        .where("createdAt", ">=", start)
        .where("createdAt", "<=", end)
        .get();
      
      const loans = loansSnapshot.docs.map(doc => doc.data());
      
      const activeLoans = loans.filter(l => l.status === "active");
      const totalDisbursements = loans.filter(l => l.disbursementDate).length;
      const totalDisbursementsAmount = loans
        .filter(l => l.disbursementDate)
        .reduce((sum, l) => sum + (l.disbursementAmount || l.loanAmount || 0), 0);
      
      const activeLoansAmount = activeLoans.reduce((sum, l) => sum + (l.loanAmount || 0), 0);
      
      const clientsSnapshot = await adminDb.collection("clients")
        .where("createdAt", ">=", start)
        .where("createdAt", "<=", end)
        .get();
      
      const clients = clientsSnapshot.docs.map(doc => doc.data());
      const convertedClients = clients.filter(c => c.status === "converted").length;
      const conversionRate = clients.length > 0 ? (convertedClients / clients.length) * 100 : 0;
      
      const topUpEligible = await adminDb.collection("loans")
        .where("status", "==", "active")
        .where("topUpNotified", "==", false)
        .get();
      
      const quotationsSnapshot = await adminDb.collection("quotations")
        .where("isHighValue", "==", true)
        .where("createdAt", ">=", start)
        .where("createdAt", "<=", end)
        .get();
      
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const monthlyLoansSnapshot = await adminDb.collection("loans")
        .where("disbursementDate", ">=", monthStart)
        .where("disbursementDate", "<=", monthEnd)
        .get();
      
      const monthlyLoans = monthlyLoansSnapshot.docs.map(doc => doc.data());
      const monthlyDisbursementsAmount = monthlyLoans.reduce((sum, l) => 
        sum + (l.disbursementAmount || l.loanAmount || 0), 0);
      
      res.json({
        totalDisbursements,
        totalDisbursementsAmount,
        activeLoans: activeLoans.length,
        activeLoansAmount,
        conversionRate: Math.round(conversionRate),
        topUpsDue: topUpEligible.size,
        highValueQuotations: quotationsSnapshot.size,
        monthlyDisbursements: monthlyLoans.length,
        monthlyDisbursementsAmount,
      });
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/disbursement-summary", verifyToken, requireRole("admin", "md"), async (req: any, res: Response) => {
    try {
      const { startDate, endDate, agentId, loanType } = req.query;
      
      let query = adminDb.collection("loans");
      
      if (startDate && endDate) {
        query = query
          .where("disbursementDate", ">=", new Date(startDate as string))
          .where("disbursementDate", "<=", new Date(endDate as string)) as any;
      }
      
      if (agentId) {
        query = query.where("agentId", "==", agentId) as any;
      }
      
      if (loanType) {
        query = query.where("loanType", "==", loanType) as any;
      }
      
      const snapshot = await query.get();
      const loans = snapshot.docs.map(doc => doc.data());
      
      const disbursedLoans = loans.filter(l => l.disbursementDate);
      
      const summary = {
        totalLoans: disbursedLoans.length,
        totalAmount: disbursedLoans.reduce((sum, l) => sum + (l.disbursementAmount || l.loanAmount || 0), 0),
        byType: {} as Record<string, any>,
        byMonth: {} as Record<string, any>,
        byAgent: {} as Record<string, any>,
      };
      
      disbursedLoans.forEach(loan => {
        if (!summary.byType[loan.loanType]) {
          summary.byType[loan.loanType] = { count: 0, amount: 0 };
        }
        summary.byType[loan.loanType].count++;
        summary.byType[loan.loanType].amount += (loan.disbursementAmount || loan.loanAmount || 0);
        
        const date = loan.disbursementDate instanceof Date 
          ? loan.disbursementDate 
          : loan.disbursementDate?.toDate?.() || new Date();
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!summary.byMonth[monthKey]) {
          summary.byMonth[monthKey] = { count: 0, amount: 0 };
        }
        summary.byMonth[monthKey].count++;
        summary.byMonth[monthKey].amount += (loan.disbursementAmount || loan.loanAmount || 0);
        
        if (!summary.byAgent[loan.agentId]) {
          summary.byAgent[loan.agentId] = { 
            agentName: loan.agentName, 
            count: 0, 
            amount: 0 
          };
        }
        summary.byAgent[loan.agentId].count++;
        summary.byAgent[loan.agentId].amount += (loan.disbursementAmount || loan.loanAmount || 0);
      });
      
      res.json(summary);
    } catch (error: any) {
      console.error("Error fetching disbursement summary:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/conversion-funnel", verifyToken, requireRole("admin", "md"), async (req: any, res: Response) => {
    try {
      const { startDate, endDate, agentId } = req.query;
      
      let clientsQuery = adminDb.collection("clients");
      
      if (startDate && endDate) {
        clientsQuery = clientsQuery
          .where("createdAt", ">=", new Date(startDate as string))
          .where("createdAt", "<=", new Date(endDate as string)) as any;
      }
      
      if (agentId) {
        clientsQuery = clientsQuery.where("assignedAgent", "==", agentId) as any;
      }
      
      const clientsSnapshot = await clientsQuery.get();
      const clients = clientsSnapshot.docs.map(doc => doc.data());
      
      const statusCounts = {
        new: clients.filter(c => c.status === "new").length,
        contacted: clients.filter(c => c.status === "contacted").length,
        in_progress: clients.filter(c => c.status === "in_progress").length,
        converted: clients.filter(c => c.status === "converted").length,
        not_converted: clients.filter(c => c.status === "not_converted").length,
      };
      
      const totalClients = clients.length;
      const conversionRate = totalClients > 0 
        ? (statusCounts.converted / totalClients) * 100 
        : 0;
      
      res.json({
        totalClients,
        statusCounts,
        conversionRate: Math.round(conversionRate * 100) / 100,
      });
    } catch (error: any) {
      console.error("Error fetching conversion funnel:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/agent-performance", verifyToken, requireRole("admin", "md"), async (req: any, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const usersSnapshot = await adminDb.collection("users")
        .where("role", "==", "agent")
        .get();
      
      const agents = await Promise.all(usersSnapshot.docs.map(async (doc) => {
        const agent = { ...doc.data(), uid: doc.id } as any;
        
        let loansQuery = adminDb.collection("loans").where("agentId", "==", agent.uid);
        
        if (startDate && endDate) {
          loansQuery = loansQuery
            .where("createdAt", ">=", new Date(startDate as string))
            .where("createdAt", "<=", new Date(endDate as string)) as any;
        }
        
        const loansSnapshot = await loansQuery.get();
        const loans = loansSnapshot.docs.map(d => d.data());
        
        let clientsQuery = adminDb.collection("clients").where("assignedAgent", "==", agent.uid);
        
        if (startDate && endDate) {
          clientsQuery = clientsQuery
            .where("createdAt", ">=", new Date(startDate as string))
            .where("createdAt", "<=", new Date(endDate as string)) as any;
        }
        
        const clientsSnapshot = await clientsQuery.get();
        const clients = clientsSnapshot.docs.map(d => d.data());
        
        const convertedClients = clients.filter(c => c.status === "converted").length;
        const conversionRate = clients.length > 0 ? (convertedClients / clients.length) * 100 : 0;
        
        return {
          uid: agent.uid,
          name: agent.displayName,
          email: agent.email,
          loansProcessed: loans.length,
          totalLoanAmount: loans.reduce((sum, l) => sum + (l.loanAmount || 0), 0),
          clientsHandled: clients.length,
          convertedClients,
          conversionRate: Math.round(conversionRate),
        };
      }));
      
      agents.sort((a, b) => b.totalLoanAmount - a.totalLoanAmount);
      
      res.json(agents);
    } catch (error: any) {
      console.error("Error fetching agent performance:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/top-up-eligible", verifyToken, requireRole("admin", "md"), async (req: any, res: Response) => {
    try {
      const snapshot = await adminDb.collection("loans")
        .where("status", "==", "active")
        .get();
      
      const loans = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any[];
      
      const policySnapshot = await adminDb.collection("policy_config").limit(1).get();
      const policy = policySnapshot.empty ? null : policySnapshot.docs[0].data() as any;
      const eligibilityMonths = policy?.topUpEligibilityMonths || 12;
      
      const now = new Date();
      const eligibleLoans = loans.filter((loan: any) => {
        const disbursementDate = loan.disbursementDate instanceof Date 
          ? loan.disbursementDate 
          : loan.disbursementDate?.toDate?.() || null;
        
        if (!disbursementDate) return false;
        
        const monthsSinceDisbursement = 
          (now.getTime() - disbursementDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        
        return monthsSinceDisbursement >= eligibilityMonths && !loan.topUpNotified;
      });
      
      res.json({
        totalEligible: eligibleLoans.length,
        loans: eligibleLoans,
        eligibilityMonths,
      });
    } catch (error: any) {
      console.error("Error fetching top-up eligible loans:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/attendance-compliance", verifyToken, requireRole("admin", "md"), async (req: any, res: Response) => {
    try {
      const { startDate, endDate, agentId } = req.query;
      
      const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      let query = adminDb.collection("attendance")
        .where("checkInTime", ">=", start)
        .where("checkInTime", "<=", end)
        .where("isDeleted", "==", false);
      
      if (agentId) {
        query = query.where("agentId", "==", agentId) as any;
      }
      
      const snapshot = await query.get();
      const attendance = snapshot.docs.map(doc => doc.data());
      
      const byAgent: Record<string, any> = {};
      
      attendance.forEach(record => {
        if (!byAgent[record.agentId]) {
          byAgent[record.agentId] = {
            agentName: record.agentName,
            totalDays: 0,
            dates: new Set(),
          };
        }
        
        const date = record.checkInTime instanceof Date 
          ? record.checkInTime 
          : record.checkInTime?.toDate?.() || new Date();
        const dateKey = date.toDateString();
        
        byAgent[record.agentId].dates.add(dateKey);
      });
      
      const workingDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      const complianceData = Object.entries(byAgent).map(([agentId, data]: [string, any]) => ({
        agentId,
        agentName: data.agentName,
        daysPresent: data.dates.size,
        totalWorkingDays: workingDays,
        complianceRate: Math.round((data.dates.size / workingDays) * 100),
      }));
      
      res.json({
        period: { start, end },
        totalWorkingDays: workingDays,
        agents: complianceData,
      });
    } catch (error: any) {
      console.error("Error fetching attendance compliance:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/high-value-quotations", verifyToken, requireRole("admin", "md"), async (req: any, res: Response) => {
    try {
      const { startDate, endDate, agentId } = req.query;
      
      let query = adminDb.collection("quotations")
        .where("isHighValue", "==", true)
        .orderBy("createdAt", "desc");
      
      if (startDate && endDate) {
        query = query
          .where("createdAt", ">=", new Date(startDate as string))
          .where("createdAt", "<=", new Date(endDate as string)) as any;
      }
      
      if (agentId) {
        query = query.where("agentId", "==", agentId) as any;
      }
      
      const snapshot = await query.limit(100).get();
      const quotations = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any[];
      
      const totalAmount = quotations.reduce((sum: number, q: any) => sum + (q.loanAmount || 0), 0);
      const byStatus = quotations.reduce((acc: Record<string, number>, q: any) => {
        acc[q.status] = (acc[q.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      res.json({
        totalQuotations: quotations.length,
        totalAmount,
        byStatus,
        quotations,
      });
    } catch (error: any) {
      console.error("Error fetching high-value quotations:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
