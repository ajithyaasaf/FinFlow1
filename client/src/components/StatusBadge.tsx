import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = 
  | "new" 
  | "contacted" 
  | "in_progress" 
  | "converted" 
  | "not_converted"
  | "draft"
  | "finalized"
  | "high_value";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  new: { label: "NEW", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  contacted: { label: "CONTACTED", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  in_progress: { label: "IN PROGRESS", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  converted: { label: "CONVERTED", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  not_converted: { label: "NOT CONVERTED", className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300" },
  draft: { label: "DRAFT", className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300" },
  finalized: { label: "FINALIZED", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  high_value: { label: "⚠️ HIGH VALUE", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="secondary" 
      className={cn("text-xs font-medium uppercase tracking-wide", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
