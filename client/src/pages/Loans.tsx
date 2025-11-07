import LoanProgressTracker from "@/components/LoanProgressTracker";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { formatINRDetailed } from "@/lib/utils";
import { Eye } from "lucide-react";

//todo: remove mock functionality
const mockLoans = [
  {
    id: "L-2024-0089",
    clientName: "Ramesh Kumar",
    amount: 500000,
    status: "in_progress" as const,
    stages: [
      { label: "Application Submitted", completed: true, current: false, date: "Jan 10, 2024" },
      { label: "Document Verification", completed: true, current: false, date: "Jan 12, 2024" },
      { label: "Credit Appraisal", completed: true, current: false, date: "Jan 15, 2024" },
      { label: "Sanction", completed: false, current: true, date: "In Progress" },
      { label: "Agreement Signed", completed: false, current: false },
      { label: "Disbursement Ready", completed: false, current: false },
    ],
  },
  {
    id: "L-2024-0088",
    clientName: "Priya Sharma",
    amount: 1200000,
    status: "converted" as const,
    stages: [
      { label: "Application Submitted", completed: true, current: false, date: "Jan 5, 2024" },
      { label: "Document Verification", completed: true, current: false, date: "Jan 7, 2024" },
      { label: "Credit Appraisal", completed: true, current: false, date: "Jan 10, 2024" },
      { label: "Sanction", completed: true, current: false, date: "Jan 12, 2024" },
      { label: "Agreement Signed", completed: true, current: false, date: "Jan 15, 2024" },
      { label: "Disbursement Ready", completed: false, current: true, date: "In Progress" },
    ],
  },
  {
    id: "L-2024-0087",
    clientName: "Vijay Patel",
    amount: 350000,
    status: "new" as const,
    stages: [
      { label: "Application Submitted", completed: false, current: true, date: "In Progress" },
      { label: "Document Verification", completed: false, current: false },
      { label: "Credit Appraisal", completed: false, current: false },
      { label: "Sanction", completed: false, current: false },
      { label: "Agreement Signed", completed: false, current: false },
      { label: "Disbursement Ready", completed: false, current: false },
    ],
  },
];

export default function Loans() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif">Loans</h1>
        <p className="text-muted-foreground mt-1">
          Track loan applications and progress
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {mockLoans.map((loan) => (
          <Card key={loan.id} className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-muted-foreground tabular-nums mb-1">
                  {loan.id}
                </p>
                <h3 className="font-semibold text-lg">{loan.clientName}</h3>
                <p className="text-2xl font-bold tabular-nums mt-2">
                  {formatINRDetailed(loan.amount)}
                </p>
              </div>
              <StatusBadge status={loan.status} />
            </div>

            <div className="space-y-4 mb-6">
              {loan.stages.map((stage, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        stage.completed
                          ? "bg-primary text-primary-foreground"
                          : stage.current
                          ? "bg-primary/20 border-2 border-primary"
                          : "bg-muted"
                      }`}
                    >
                      {stage.completed ? "✓" : index + 1}
                    </div>
                    {index < loan.stages.length - 1 && (
                      <div
                        className={`w-0.5 h-8 mt-1 ${
                          stage.completed ? "bg-primary" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p
                      className={`text-sm font-medium ${
                        stage.current ? "text-primary" : ""
                      }`}
                    >
                      {stage.label}
                    </p>
                    {stage.date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {stage.date}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full"
              data-testid={`button-view-loan-${loan.id}`}
              onClick={() => console.log('View loan details:', loan.id)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
