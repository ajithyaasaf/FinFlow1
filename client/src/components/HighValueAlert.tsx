import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { formatINRDetailed } from "@/lib/utils";

interface HighValueAlertProps {
  clientName: string;
  agentName: string;
  amount: number;
  timestamp: string;
  quotationId: string;
}

export default function HighValueAlert({
  clientName,
  agentName,
  amount,
  timestamp,
  quotationId,
}: HighValueAlertProps) {
  return (
    <Card className="p-6 border-l-4 border-l-orange-500">
      <div className="flex items-start gap-4">
        <div className="text-orange-500 mt-1">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="font-semibold text-lg mb-1">{clientName}</h3>
              <p className="text-sm text-muted-foreground">
                Agent: {agentName} • {timestamp}
              </p>
            </div>
            <StatusBadge status="high_value" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold tabular-nums">{formatINRDetailed(amount)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                ID: {quotationId}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              data-testid="button-view-quotation"
              onClick={() => console.log('View quotation:', quotationId)}
            >
              View Details
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
