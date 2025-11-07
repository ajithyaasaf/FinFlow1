import ClientCard from "@/components/ClientCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

//todo: remove mock functionality
const mockClients = [
  {
    id: "1",
    name: "Ramesh Kumar",
    phone: "+91 98765 43210",
    email: "ramesh.kumar@email.com",
    location: "Mumbai, Maharashtra",
    status: "in_progress" as const,
    loanAmount: 500000,
    lastContact: "2 days ago",
  },
  {
    id: "2",
    name: "Priya Sharma",
    phone: "+91 98765 43211",
    email: "priya.sharma@email.com",
    location: "Delhi, NCR",
    status: "converted" as const,
    loanAmount: 1200000,
    lastContact: "1 week ago",
  },
  {
    id: "3",
    name: "Vijay Patel",
    phone: "+91 98765 43212",
    email: "vijay.patel@email.com",
    location: "Bangalore, Karnataka",
    status: "new" as const,
    lastContact: "Today",
  },
  {
    id: "4",
    name: "Sneha Reddy",
    phone: "+91 98765 43213",
    email: "sneha.reddy@email.com",
    location: "Hyderabad, Telangana",
    status: "contacted" as const,
    loanAmount: 750000,
    lastContact: "3 days ago",
  },
  {
    id: "5",
    name: "Amit Singh",
    phone: "+91 98765 43214",
    email: "amit.singh@email.com",
    location: "Pune, Maharashtra",
    status: "not_converted" as const,
    lastContact: "2 weeks ago",
  },
  {
    id: "6",
    name: "Kavita Gupta",
    phone: "+91 98765 43215",
    email: "kavita.gupta@email.com",
    location: "Chennai, Tamil Nadu",
    status: "in_progress" as const,
    loanAmount: 350000,
    lastContact: "1 day ago",
  },
];

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your clients
          </p>
        </div>
        <Button data-testid="button-add-client" onClick={() => console.log('Add new client')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name, phone, or email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-clients"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="not_converted">Not Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockClients.map((client) => (
          <ClientCard key={client.id} {...client} />
        ))}
      </div>
    </div>
  );
}
