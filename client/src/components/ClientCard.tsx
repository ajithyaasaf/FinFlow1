import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StatusBadge from "./StatusBadge";
import { Phone, Mail, MapPin, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientCardProps {
  name: string;
  phone: string;
  email: string;
  location: string;
  status: "new" | "contacted" | "in_progress" | "converted" | "not_converted";
  loanAmount?: number;
  lastContact?: string;
}

export default function ClientCard({
  name,
  phone,
  email,
  location,
  status,
  loanAmount,
  lastContact,
}: ClientCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="p-6 hover-elevate">
      <div className="flex items-start gap-4">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{name}</h3>
              {lastContact && (
                <p className="text-xs text-muted-foreground">
                  Last contact: {lastContact}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid="button-client-menu"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem data-testid="menu-view-client">
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-edit-client">
                    Edit Client
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-create-quotation">
                    Create Quotation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span className="tabular-nums">{phone}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="truncate">{email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{location}</span>
            </div>
          </div>
          {loanAmount && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">Loan Amount</p>
              <p className="font-semibold tabular-nums">
                ₹{loanAmount.toLocaleString("en-IN")}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
