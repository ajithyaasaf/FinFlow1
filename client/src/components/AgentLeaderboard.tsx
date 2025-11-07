import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatINR } from "@/lib/utils";
import { Trophy, TrendingUp } from "lucide-react";

interface AgentStats {
  rank: number;
  name: string;
  conversionRate: number;
  totalAmount: number;
  loansProcessed: number;
}

interface AgentLeaderboardProps {
  agents: AgentStats[];
}

export default function AgentLeaderboard({ agents }: AgentLeaderboardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Agent Leaderboard</h3>
      </div>
      <div className="space-y-4">
        {agents.map((agent) => {
          const initials = agent.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <div
              key={agent.rank}
              className="flex items-center gap-4 p-3 rounded-md hover-elevate"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 text-center">
                  <span
                    className={`font-bold text-lg ${
                      agent.rank === 1
                        ? "text-yellow-600 dark:text-yellow-400"
                        : agent.rank === 2
                        ? "text-gray-400"
                        : agent.rank === 3
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {agent.rank}
                  </span>
                </div>
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{agent.name}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span className="tabular-nums">
                      {agent.loansProcessed} loans
                    </span>
                    <span className="tabular-nums">
                      {formatINR(agent.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-semibold tabular-nums">
                    {agent.conversionRate}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">conversion</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
