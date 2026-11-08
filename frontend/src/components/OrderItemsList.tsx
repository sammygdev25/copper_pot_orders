import type { OrderItem } from '../types';
import { Stack, Price } from '../components/ui';
import { Icon } from '../components/icons';

interface OrderItemsListProps {
  items: OrderItem[];
}

export default function OrderItemsList({ items }: OrderItemsListProps) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="ds-empty">
        <Icon name="package" size={28} />
        <p className="ds-muted">No items on this order.</p>
      </div>
    );
  }

  return (
    <Stack gap="sm" className="order-items-list">
      {items.map((item) => (
        <div key={item.id} className="ds-between order-items-list-row">
          <div className="ds-cluster">
            <span className="badge" aria-label={`Quantity ${item.quantity}`}>
              {item.quantity}x
            </span>
            <span>{`Item #${item.menu_item}`}</span>
          </div>
          <Price value={Number(item.price) * item.quantity} />
        </div>
      ))}
    </Stack>
  );
}
