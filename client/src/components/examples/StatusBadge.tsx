import StatusBadge from "../StatusBadge";

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-4 p-8">
      <StatusBadge status="new" />
      <StatusBadge status="contacted" />
      <StatusBadge status="in_progress" />
      <StatusBadge status="converted" />
      <StatusBadge status="not_converted" />
      <StatusBadge status="draft" />
      <StatusBadge status="finalized" />
      <StatusBadge status="high_value" />
    </div>
  );
}
