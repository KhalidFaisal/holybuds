export default function OrderStatusBadge({ status }) {
  const config = {
    PENDING: { label: 'Pending', classes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    PROCESSING: { label: 'Processing', classes: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    READY: { label: 'Ready', classes: 'bg-pc-green/20 text-pc-green border-pc-green/30' },
    DELIVERED: { label: 'Delivered', classes: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    COMPLETED: { label: 'Completed', classes: 'bg-green-500/20 text-green-400 border-green-500/30' },
    CANCELLED: { label: 'Cancelled', classes: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };

  const { label, classes } = config[status] || config.PENDING;

  return (
    <span className={`badge border ${classes}`}>
      {label}
    </span>
  );
}
