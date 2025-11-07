import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import MetricCard from "@/components/MetricCard";
import HighValueAlert from "@/components/HighValueAlert";
import AgentLeaderboard from "@/components/AgentLeaderboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users, TrendingUp, Bell, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatINR, formatDate } from "@/lib/utils";
import type { DashboardStats, Quotation } from "@shared/firestoreTypes";

interface AgentPerformance {
  uid: string;
  name: string;
  email: string;
  loansProcessed: number;
  totalLoanAmount: number;
  clientsHandled: number;
  convertedClients: number;
  conversionRate: number;
}

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/reports/dashboard-stats"],
  });

  const { data: agentPerformance = [], isLoading: agentsLoading } = useQuery<AgentPerformance[]>({
    queryKey: ["/api/reports/agent-performance"],
    enabled: userProfile?.role === "admin" || userProfile?.role === "md",
  });

  const { data: highValueData, isLoading: quotationsLoading } = useQuery<{
    quotations: Quotation[];
    totalQuotations: number;
  }>({
    queryKey: ["/api/reports/high-value-quotations"],
    enabled: userProfile?.role === "admin" || userProfile?.role === "md",
  });
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <Button data-testid="button-add-client" onClick={() => setLocation("/clients")}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading && !stats ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </Card>
            ))}
          </>
        ) : (
          <>
            <MetricCard
              title="Total Disbursements"
              value={formatINR(stats?.totalDisbursementsAmount || 0)}
              trend={{ value: `${stats?.totalDisbursements || 0} loans`, isPositive: true }}
              icon={DollarSign}
            />
            <MetricCard
              title="Active Loans"
              value={stats?.activeLoans?.toString() || "0"}
              trend={{ value: formatINR(stats?.activeLoansAmount || 0), isPositive: true }}
              icon={Users}
            />
            <MetricCard
              title="Conversion Rate"
              value={`${stats?.conversionRate || 0}%`}
              icon={TrendingUp}
            />
            <MetricCard
              title="Top-ups Due"
              value={stats?.topUpsDue?.toString() || "0"}
              icon={Bell}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-6">Monthly Performance</h3>
            {statsLoading && !stats ? (
              <Skeleton className="w-full h-[300px]" />
            ) : stats?.monthlyDisbursements ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-md">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold">{stats.monthlyDisbursements} Loans</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold">{formatINR(stats.monthlyDisbursementsAmount || 0)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Avg per Loan</p>
                    <p className="text-lg font-bold">
                      {formatINR(stats.monthlyDisbursements > 0 
                        ? (stats.monthlyDisbursementsAmount || 0) / stats.monthlyDisbursements 
                        : 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Conversion</p>
                    <p className="text-lg font-bold">{stats.conversionRate}%</p>
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">High-Value</p>
                    <p className="text-lg font-bold">{stats.highValueQuotations}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">No data available</div>
            )}
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">High-Value Quotations</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                data-testid="button-view-all-quotations"
                onClick={() => setLocation("/quotations")}
              >
                View All
              </Button>
            </div>
            {quotationsLoading ? (
              <Card className="p-6">
                <Skeleton className="h-20 w-full" />
              </Card>
            ) : highValueData && highValueData.quotations.length > 0 ? (
              highValueData.quotations.slice(0, 3).map((quotation) => (
                <HighValueAlert
                  key={quotation.id}
                  clientName={quotation.clientName}
                  agentName={quotation.agentName}
                  amount={quotation.loanAmount}
                  timestamp={formatDate(quotation.createdAt, "relative")}
                  quotationId={quotation.quotationNumber || quotation.id || ""}
                />
              ))
            ) : (
              <Card className="p-6">
                <p className="text-center text-muted-foreground">No high-value quotations</p>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {agentsLoading ? (
            <Card className="p-6">
              <Skeleton className="h-8 w-32 mb-4" />
              <Skeleton className="h-40 w-full" />
            </Card>
          ) : (
            <AgentLeaderboard
              agents={agentPerformance.slice(0, 5).map((agent, idx) => ({
                rank: idx + 1,
                name: agent.name,
                conversionRate: agent.conversionRate,
                totalAmount: agent.totalLoanAmount,
                loansProcessed: agent.loansProcessed,
              }))}
            />
          )}
          
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                data-testid="button-create-quotation"
                onClick={() => setLocation("/quotations")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Quotation
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                data-testid="button-mark-attendance"
                onClick={() => setLocation("/attendance")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Mark Attendance
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                data-testid="button-view-reports"
                onClick={() => setLocation("/reports")}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Reports
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
