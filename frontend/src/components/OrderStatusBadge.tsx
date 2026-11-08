import { Badge } from '../components/ui';

interface OrderStatusBadgeProps {
  status: string;
}

const STATUS_TONES: Record<string, 'neutral' | 'primary' | 'soft' | 'success' | 'danger'> = {
  placed: 'primary',
  preparing: 'soft',
  ready: 'success',
  completed: 'neutral',
};

const STATUS_LABELS: Record<string, string> = {
  placed: 'Placed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
};

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const tone = STATUS_TONES[status] || 'neutral';
  const label = STATUS_LABELS[status] || status;

  return <Badge tone={tone}>{label}</Badge>;
}