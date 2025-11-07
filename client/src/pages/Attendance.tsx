import AttendanceCard from "@/components/AttendanceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Calendar, Search, Download, Users, Clock, MapPin } from "lucide-react";
import { useState } from "react";

//todo: remove mock functionality
const mockAttendance = [
  {
    id: "1",
    agentName: "Rajesh Kumar",
    photo: "",
    time: "09:15 AM",
    location: "Andheri West, Mumbai, Maharashtra 400058",
    description: "Client visit - Ramesh & Sons Pvt Ltd for loan discussion",
  },
  {
    id: "2",
    agentName: "Priya Sharma",
    photo: "",
    time: "10:30 AM",
    location: "Connaught Place, New Delhi 110001",
    description: "Document collection - Mumbai Traders Inc",
  },
  {
    id: "3",
    agentName: "Amit Patel",
    photo: "",
    time: "11:45 AM",
    location: "Koramangala, Bangalore, Karnataka 560095",
    description: "Quotation discussion with new client - TechStart Solutions",
  },
  {
    id: "4",
    agentName: "Sneha Reddy",
    photo: "",
    time: "08:50 AM",
    location: "Banjara Hills, Hyderabad, Telangana 500034",
    description: "Follow-up meeting with existing client",
  },
  {
    id: "5",
    agentName: "Vikram Singh",
    photo: "",
    time: "09:30 AM",
    location: "Hinjewadi, Pune, Maharashtra 411057",
    description: "Site visit for business loan verification",
  },
  {
    id: "6",
    agentName: "Kavita Gupta",
    photo: "",
    time: "10:15 AM",
    location: "Anna Nagar, Chennai, Tamil Nadu 600040",
    description: "New client onboarding - Retail business loan",
  },
];

export default function Attendance() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif">Attendance</h1>
          <p className="text-muted-foreground mt-1">
            Track agent attendance and field activities
          </p>
        </div>
        <Button
          variant="outline"
          data-testid="button-export-attendance"
          onClick={() => console.log('Export attendance')}
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-md bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Present Today</p>
              <p className="text-2xl font-bold tabular-nums">24/28</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-md bg-green-500/10">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">On Time</p>
              <p className="text-2xl font-bold tabular-nums">22/24</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-md bg-blue-500/10">
              <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Field Visits</p>
              <p className="text-2xl font-bold tabular-nums">18</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by agent name or location..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-attendance"
          />
        </div>
        <Button
          variant="outline"
          data-testid="button-filter-date"
          onClick={() => console.log('Filter by date')}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Today
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockAttendance.map((attendance) => (
          <AttendanceCard
            key={attendance.id}
            {...attendance}
            onEdit={() => console.log('Edit attendance:', attendance.id)}
            onDelete={() => console.log('Delete attendance:', attendance.id)}
          />
        ))}
      </div>
    </div>
  );
}
