import ClientCard from "../ClientCard";

export default function ClientCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 max-w-6xl">
      <ClientCard
        name="Ramesh Kumar"
        phone="+91 98765 43210"
        email="ramesh.kumar@email.com"
        location="Mumbai, Maharashtra"
        status="in_progress"
        loanAmount={500000}
        lastContact="2 days ago"
      />
      <ClientCard
        name="Priya Sharma"
        phone="+91 98765 43211"
        email="priya.sharma@email.com"
        location="Delhi, NCR"
        status="converted"
        loanAmount={1200000}
        lastContact="1 week ago"
      />
      <ClientCard
        name="Vijay Patel"
        phone="+91 98765 43212"
        email="vijay.patel@email.com"
        location="Bangalore, Karnataka"
        status="new"
        lastContact="Today"
      />
    </div>
  );
}
