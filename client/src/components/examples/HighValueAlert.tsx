import HighValueAlert from "../HighValueAlert";

export default function HighValueAlertExample() {
  return (
    <div className="p-8 space-y-4 max-w-4xl">
      <HighValueAlert
        clientName="Ramesh & Sons Pvt Ltd"
        agentName="Rajesh Kumar"
        amount={1200000}
        timestamp="2 hours ago"
        quotationId="Q-2024-00142"
      />
      <HighValueAlert
        clientName="Mumbai Traders Inc"
        agentName="Priya Sharma"
        amount={1550000}
        timestamp="5 hours ago"
        quotationId="Q-2024-00138"
      />
    </div>
  );
}
