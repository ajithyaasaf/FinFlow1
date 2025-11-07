import MetricCard from "@/components/MetricCard";
import HighValueAlert from "@/components/HighValueAlert";
import AgentLeaderboard from "@/components/AgentLeaderboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, TrendingUp, Bell, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

//todo: remove mock functionality
const conversionData = [
  { month: "Jan", disbursed: 120, converted: 85 },
  { month: "Feb", disbursed: 145, converted: 98 },
  { month: "Mar", disbursed: 165, converted: 112 },
  { month: "Apr", disbursed: 142, converted: 95 },
  { month: "May", disbursed: 178, converted: 121 },
  { month: "Jun", disbursed: 195, converted: 142 },
];

const agentStats = [
  { rank: 1, name: "Rajesh Kumar", conversionRate: 78, totalAmount: 8500000, loansProcessed: 45 },
  { rank: 2, name: "Priya Sharma", conversionRate: 72, totalAmount: 7200000, loansProcessed: 38 },
  { rank: 3, name: "Amit Patel", conversionRate: 68, totalAmount: 6800000, loansProcessed: 42 },
  { rank: 4, name: "Sneha Reddy", conversionRate: 65, totalAmount: 5900000, loansProcessed: 35 },
  { rank: 5, name: "Vikram Singh", conversionRate: 62, totalAmount: 5400000, loansProcessed: 31 },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <Button data-testid="button-add-client" onClick={() => console.log('Add client')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Disbursements"
          value="₹12.5Cr"
          trend={{ value: "12%", isPositive: true }}
          icon={DollarSign}
        />
        <MetricCard
          title="Active Loans"
          value="284"
          trend={{ value: "8%", isPositive: true }}
          icon={Users}
        />
        <MetricCard
          title="Conversion Rate"
          value="68%"
          trend={{ value: "3%", isPositive: false }}
          icon={TrendingUp}
        />
        <MetricCard title="Top-ups Due" value="42" icon={Bell} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-6">Conversion Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar dataKey="disbursed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="converted" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">High-Value Quotations</h3>
              <Button variant="ghost" size="sm" data-testid="button-view-all-quotations">
                View All
              </Button>
            </div>
            <HighValueAlert
              clientName="Ramesh & Sons Pvt Ltd"
              agentName="Rajesh Kumar"
              amount={1200000}
              timestamp="2 hours ago"
              quotationId="Q-2024-00142"
            />
            <HighValueAlert
              clientName="Mumbai Traders Inc"
              agentName="Priya Sharma"
              amount={1550000}
              timestamp="5 hours ago"
              quotationId="Q-2024-00138"
            />
          </div>
        </div>

        <div className="space-y-6">
          <AgentLeaderboard agents={agentStats} />
          
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                data-testid="button-create-quotation"
                onClick={() => console.log('Create quotation')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Quotation
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                data-testid="button-mark-attendance"
                onClick={() => console.log('Mark attendance')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Mark Attendance
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                data-testid="button-view-reports"
                onClick={() => console.log('View reports')}
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
