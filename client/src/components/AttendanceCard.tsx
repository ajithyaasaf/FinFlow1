import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Edit2, Trash2 } from "lucide-react";

interface AttendanceCardProps {
  agentName: string;
  photo: string;
  time: string;
  location: string;
  description: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function AttendanceCard({
  agentName,
  photo,
  time,
  location,
  description,
  onEdit,
  onDelete,
}: AttendanceCardProps) {
  const initials = agentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="p-4 hover-elevate">
      <div className="flex items-start gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={photo} alt={agentName} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h4 className="font-semibold">{agentName}</h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock className="w-3 h-3" />
                <span className="tabular-nums">{time}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid="button-edit-attendance"
                onClick={onEdit}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                data-testid="button-delete-attendance"
                onClick={onDelete}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-1 text-sm text-muted-foreground mb-2">
            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
          <p className="text-sm">{description}</p>
        </div>
      </div>
    </Card>
  );
}
