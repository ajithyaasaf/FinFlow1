import MetricCard from "../MetricCard";
import { DollarSign } from "lucide-react";

export default function MetricCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
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
      />
      <MetricCard
        title="Conversion Rate"
        value="68%"
        trend={{ value: "3%", isPositive: false }}
      />
      <MetricCard
        title="Top-ups Due"
        value="42"
      />
    </div>
  );
}
