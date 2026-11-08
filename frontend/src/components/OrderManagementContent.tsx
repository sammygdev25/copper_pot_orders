import type { Order } from '../types';
import OrderColumn from './OrderColumn';
import { SkeletonCards, EmptyState } from '../components/ui';

interface OrderManagementContentProps {
  orders: Order[];
  loading: boolean;
  onStatusChange: (id: number, status: string) => void;
}

const COLUMNS: { title: string; status: string }[] = [
  { title: 'Placed', status: 'placed' },
  { title: 'Preparing', status: 'preparing' },
  { title: 'Ready', status: 'ready' },
  { title: 'Completed', status: 'completed' },
];

export default function OrderManagementContent({ orders, loading, onStatusChange }: OrderManagementContentProps) {
  if (loading) {
    return <SkeletonCards count={4} />;
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon="package"
        title="No orders yet"
        text="Orders placed through Copper Pot Kitchen will appear here, sorted by status, as soon as customers start checking out."
      />
    );
  }

  return (
    <div className="ds-grid ds-grid-lg" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
      {COLUMNS.map((col) => (
        <OrderColumn
          key={col.status}
          title={col.title}
          status={col.status}
          orders={(Array.isArray(orders) ? orders : []).filter((o) => o.status === col.status)}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}