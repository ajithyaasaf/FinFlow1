import LoanProgressTracker from "../LoanProgressTracker";

export default function LoanProgressTrackerExample() {
  const stages = [
    { label: "Application Submitted", completed: true, current: false, date: "Jan 15, 2024" },
    { label: "Document Verification", completed: true, current: false, date: "Jan 18, 2024" },
    { label: "Credit Appraisal", completed: true, current: false, date: "Jan 22, 2024" },
    { label: "Sanction", completed: false, current: true, date: "In Progress" },
    { label: "Agreement Signed", completed: false, current: false },
    { label: "Disbursement Ready", completed: false, current: false },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <LoanProgressTracker stages={stages} />
    </div>
  );
}
