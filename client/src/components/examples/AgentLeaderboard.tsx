import AgentLeaderboard from "../AgentLeaderboard";

export default function AgentLeaderboardExample() {
  const agents = [
    { rank: 1, name: "Rajesh Kumar", conversionRate: 78, totalAmount: 8500000, loansProcessed: 45 },
    { rank: 2, name: "Priya Sharma", conversionRate: 72, totalAmount: 7200000, loansProcessed: 38 },
    { rank: 3, name: "Amit Patel", conversionRate: 68, totalAmount: 6800000, loansProcessed: 42 },
    { rank: 4, name: "Sneha Reddy", conversionRate: 65, totalAmount: 5900000, loansProcessed: 35 },
    { rank: 5, name: "Vikram Singh", conversionRate: 62, totalAmount: 5400000, loansProcessed: 31 },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <AgentLeaderboard agents={agents} />
    </div>
  );
}
