type Status = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

const styles: Record<Status, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
  DEACTIVATED: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

const labels: Record<Status, string> = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  DEACTIVATED: 'Deactivated',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}