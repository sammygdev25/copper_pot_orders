import type { Order } from '../types';
import { EmptyState } from './ui';
import StaffOrderCard from './StaffOrderCard';

interface OrderColumnProps {
  title: string;
  status: string;
  orders: Order[];
  onStatusChange: (orderId: number, status: string) => void;
}

export default function OrderColumn({ title, status, orders, onStatusChange }: OrderColumnProps) {
  const columnOrders = (Array.isArray(orders) ? orders : []).filter((o) => o.status === status);

  return (
    <div className="ds-stack" style={{ gap: 'var(--space-sm)' }}>
      <div className="ds-between">
        <h3 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>{title}</h3>
        <span className="badge">{columnOrders.length}</span>
      </div>
      <div className="ds-stack" style={{ gap: 'var(--space-sm)' }}>
        {columnOrders.length === 0 ? (
          <EmptyState
            icon="package"
            title="No orders here"
            text={`No orders with status "${title}" right now.`}
          />
        ) : (
          columnOrders.map((order) => (
            <StaffOrderCard key={order.id} order={order} onStatusChange={onStatusChange} />
          ))
        )}
      </div>
    </div>
  );
}