import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { formatINRDetailed } from "@/lib/utils";
import { Plus, Download, Eye, Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

//todo: remove mock functionality
const mockQuotations = [
  {
    id: "Q-2024-00142",
    clientName: "Ramesh & Sons Pvt Ltd",
    agent: "Rajesh Kumar",
    amount: 1200000,
    interestRate: 11.5,
    tenure: 60,
    status: "high_value" as const,
    date: "Today, 2:30 PM",
  },
  {
    id: "Q-2024-00141",
    clientName: "TechStart Solutions",
    agent: "Priya Sharma",
    amount: 850000,
    interestRate: 12.5,
    tenure: 48,
    status: "finalized" as const,
    date: "Today, 11:15 AM",
  },
  {
    id: "Q-2024-00140",
    clientName: "Mumbai Traders Inc",
    agent: "Amit Patel",
    amount: 1550000,
    interestRate: 10.8,
    tenure: 72,
    status: "high_value" as const,
    date: "Yesterday, 4:45 PM",
  },
  {
    id: "Q-2024-00139",
    clientName: "Retail Mart Ltd",
    agent: "Sneha Reddy",
    amount: 450000,
    interestRate: 13.0,
    tenure: 36,
    status: "finalized" as const,
    date: "Yesterday, 10:20 AM",
  },
  {
    id: "Q-2024-00138",
    clientName: "Green Energy Co",
    agent: "Vikram Singh",
    amount: 680000,
    interestRate: 12.2,
    tenure: 42,
    status: "draft" as const,
    date: "Jan 15, 2024",
  },
];

export default function Quotations() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif">Quotations</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track loan quotations
          </p>
        </div>
        <Button data-testid="button-create-quotation" onClick={() => console.log('Create new quotation')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Quotation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Quotations</p>
          <p className="text-3xl font-bold tabular-nums">142</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">High-Value</p>
          <p className="text-3xl font-bold tabular-nums text-orange-600 dark:text-orange-400">
            12
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Finalized</p>
          <p className="text-3xl font-bold tabular-nums text-green-600 dark:text-green-400">
            98
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Draft</p>
          <p className="text-3xl font-bold tabular-nums">32</p>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quotation ID</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Interest</TableHead>
              <TableHead className="text-right">Tenure</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockQuotations.map((quotation) => (
              <TableRow key={quotation.id} data-testid={`row-quotation-${quotation.id}`}>
                <TableCell className="font-medium tabular-nums">
                  {quotation.id}
                </TableCell>
                <TableCell>{quotation.clientName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {quotation.agent}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatINRDetailed(quotation.amount)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {quotation.interestRate}%
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {quotation.tenure} months
                </TableCell>
                <TableCell>
                  <StatusBadge status={quotation.status} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {quotation.date}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      data-testid={`button-view-${quotation.id}`}
                      onClick={() => console.log('View quotation:', quotation.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      data-testid={`button-edit-${quotation.id}`}
                      onClick={() => console.log('Edit quotation:', quotation.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      data-testid={`button-download-${quotation.id}`}
                      onClick={() => console.log('Download PDF:', quotation.id)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
