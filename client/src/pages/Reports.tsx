import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, TrendingUp, Users, DollarSign, PieChart } from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { DashboardStats } from "@shared/firestoreTypes";

export default function Reports() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("month");
  
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/reports/dashboard-stats"],
    enabled: user?.role === "admin" || user?.role === "md",
  });

  const { data: disbursementSummary } = useQuery({
    queryKey: ["/api/reports/disbursement-summary"],
    enabled: user?.role === "admin" || user?.role === "md",
  });

  const { data: agentPerformance } = useQuery({
    queryKey: ["/api/reports/agent-performance"],
    enabled: user?.role === "admin" || user?.role === "md",
  });

  if (user?.role !== "admin" && user?.role !== "md") {
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
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive business insights and performance metrics</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disbursements</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(stats?.totalDisbursementsAmount || 0)}</div>
            <p className="text-xs text-muted-foreground">{stats?.totalDisbursements || 0} loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeLoans || 0}</div>
            <p className="text-xs text-muted-foreground">{formatINR(stats?.activeLoansAmount || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Lead to loan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top-Ups Due</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.topUpsDue || 0}</div>
            <p className="text-xs text-muted-foreground">Eligible loans</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="disbursement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="disbursement">Disbursement Summary</TabsTrigger>
          <TabsTrigger value="agent">Agent Performance</TabsTrigger>
          <TabsTrigger value="topup">Top-Up Eligible</TabsTrigger>
        </TabsList>

        <TabsContent value="disbursement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Disbursement Summary</CardTitle>
              <CardDescription>Loan disbursement breakdown by type and period</CardDescription>
            </CardHeader>
            <CardContent>
              {disbursementSummary ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">By Loan Type</h3>
                    <div className="space-y-2">
                      {Object.entries((disbursementSummary as any).byType || {}).map(([type, data]: any) => (
                        <div key={type} className="flex justify-between items-center p-3 bg-muted rounded-md">
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                          <div className="text-right">
                            <div className="font-semibold">{formatINR(data.amount)}</div>
                            <div className="text-sm text-muted-foreground">{data.count} loans</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>Individual agent metrics and rankings</CardDescription>
            </CardHeader>
            <CardContent>
              {agentPerformance ? (
                <div className="space-y-2">
                  {(agentPerformance as any[]).slice(0, 10).map((agent, index) => (
                    <div key={agent.uid} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-muted-foreground">#{index + 1}</span>
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-sm text-muted-foreground">{agent.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatINR(agent.totalLoanAmount)}</div>
                        <div className="text-sm text-muted-foreground">
                          {agent.loansProcessed} loans • {agent.conversionRate}% conversion
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top-Up Eligible Loans</CardTitle>
              <CardDescription>Loans eligible for top-up financing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Feature coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
