import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Download, Calendar, TrendingUp } from "lucide-react";
import { formatINRDetailed, getMonthName } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Payroll } from "@shared/firestoreTypes";

export default function PayrollPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: payrolls = [], isLoading, refetch } = useQuery<Payroll[]>({
    queryKey: ["/api/payroll", {
      year: selectedYear,
      month: selectedMonth,
      status: statusFilter === "all" ? undefined : statusFilter,
    }],
    enabled: userProfile?.role === "admin" || userProfile?.role === "md",
  });

  const stats = {
    totalPayroll: payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0),
    avgSalary: payrolls.length > 0 
      ? payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0) / payrolls.length 
      : 0,
    pendingCount: payrolls.filter(p => p.status === "draft").length,
    approvedCount: payrolls.filter(p => p.status === "approved").length,
  };

  const handleDownloadPayslip = async (payrollId: string) => {
    try {
      const res = await fetch(`/api/payroll/${payrollId}/generate-payslip`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to generate payslip");
      }

      const data = await res.json();
      window.open(data.url, "_blank");

      toast({
        title: "Success",
        description: "Payslip generated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (payrollId: string) => {
    try {
      const res = await fetch(`/api/payroll/${payrollId}/approve`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to approve payroll");
      }

      toast({
        title: "Success",
        description: "Payroll approved successfully",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (userProfile?.role !== "admin" && userProfile?.role !== "md") {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to view this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">Manage employee salaries and generate payslips</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-payroll">
              {formatINRDetailed(stats.totalPayroll)}
            </div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-avg-salary">
              {formatINRDetailed(stats.avgSalary)}
            </div>
            <p className="text-xs text-muted-foreground">Per employee</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-pending">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-approved">{stats.approvedCount}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40" data-testid="select-month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <SelectItem key={month} value={month.toString()}>
                    {getMonthName(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32" data-testid="select-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading payroll...</div>
          ) : payrolls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payroll records found for this period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Days Present</TableHead>
                  <TableHead className="text-right">Basic Salary</TableHead>
                  <TableHead className="text-right">Gross Salary</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.map((payroll) => (
                  <TableRow key={payroll.id} data-testid={`row-payroll-${payroll.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payroll.employeeName}</div>
                        <div className="text-sm text-muted-foreground">{payroll.employeeEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getMonthName(payroll.month)} {payroll.year}
                    </TableCell>
                    <TableCell className="text-right">
                      {payroll.daysPresent}/{payroll.totalWorkingDays}
                    </TableCell>
                    <TableCell className="text-right">{formatINRDetailed(payroll.basicSalary)}</TableCell>
                    <TableCell className="text-right">{formatINRDetailed(payroll.grossSalary)}</TableCell>
                    <TableCell className="text-right">{formatINRDetailed(payroll.totalDeductions)}</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatINRDetailed(payroll.netSalary)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={payroll.status === "approved" ? "default" : "secondary"}>
                        {payroll.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {payroll.status === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadPayslip(payroll.id!)}
                            data-testid={`button-download-${payroll.id}`}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Payslip
                          </Button>
                        )}
                        {payroll.status === "draft" && userProfile?.role === "admin" && (
                          <Button
                            size="sm"
                            onClick={() => handleApprove(payroll.id!)}
                            data-testid={`button-approve-${payroll.id}`}
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
