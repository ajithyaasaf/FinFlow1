import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Stage {
  label: string;
  completed: boolean;
  current: boolean;
  date?: string;
}

interface LoanProgressTrackerProps {
  stages: Stage[];
  className?: string;
}

export default function LoanProgressTracker({
  stages,
  className,
}: LoanProgressTrackerProps) {
  return (
    <Card className={cn("p-6", className)}>
      <h3 className="font-semibold text-lg mb-6">Loan Progress</h3>
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  stage.completed
                    ? "bg-primary text-primary-foreground"
                    : stage.current
                    ? "bg-primary/20 border-2 border-primary"
                    : "bg-muted border-2 border-border"
                )}
              >
                {stage.completed ? (
                  <Check className="w-4 h-4" />
                ) : stage.current ? (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                )}
              </div>
              {index < stages.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 h-12 mt-1",
                    stage.completed ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
            <div className="flex-1 pb-8">
              <p
                className={cn(
                  "font-medium mb-1",
                  stage.current && "text-primary"
                )}
              >
                {stage.label}
              </p>
              {stage.date && (
                <p className="text-xs text-muted-foreground">{stage.date}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
