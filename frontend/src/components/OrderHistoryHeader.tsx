import { PageHeader } from '../components/ui';
import { Icon } from '../components/icons';

interface OrderHistoryHeaderUser {
  name?: string;
  email?: string;
}

interface OrderHistoryHeaderProps {
  user?: OrderHistoryHeaderUser | null;
  orderCount?: number;
}

export default function OrderHistoryHeader({ user, orderCount }: OrderHistoryHeaderProps) {
  const identity = user?.name || user?.email || 'there';

  return (
    <PageHeader
      eyebrow="Copper Pot Kitchen"
      title="Your order history"
      subtitle={
        <span className="ds-cluster">
          <Icon name="user" size={16} />
          Welcome back, {identity}
          {typeof orderCount === 'number' && (
            <span className="ds-muted">
              {' '}
              &middot; {orderCount} {orderCount === 1 ? 'order' : 'orders'} placed
            </span>
          )}
        </span>
      }
    />
  );
}