import AttendanceCard from "../AttendanceCard";

export default function AttendanceCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8">
      <AttendanceCard
        agentName="Rajesh Kumar"
        photo=""
        time="09:15 AM"
        location="Andheri West, Mumbai, Maharashtra"
        description="Client visit - Ramesh & Sons Pvt Ltd"
        onEdit={() => console.log('Edit attendance')}
        onDelete={() => console.log('Delete attendance')}
      />
      <AttendanceCard
        agentName="Priya Sharma"
        photo=""
        time="10:30 AM"
        location="Connaught Place, New Delhi"
        description="Document collection - Mumbai Traders"
        onEdit={() => console.log('Edit attendance')}
        onDelete={() => console.log('Delete attendance')}
      />
      <AttendanceCard
        agentName="Amit Patel"
        photo=""
        time="11:45 AM"
        location="Koramangala, Bangalore"
        description="Quotation discussion with new client"
        onEdit={() => console.log('Edit attendance')}
        onDelete={() => console.log('Delete attendance')}
      />
    </div>
  );
}
