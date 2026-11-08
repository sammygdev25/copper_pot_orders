import { Section, Split, Media, Badge, Price, Button, CardMeta } from '../components/ui';
import { Icon } from '../components/icons';
import type { Order } from '../types';

interface OrderDetailMediaProps {
  order: Order;
  onReorder?: () => void;
}

export default function OrderDetailMedia({ order, onReorder }: OrderDetailMediaProps) {
  const createdDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <Section tight>
      <Split>
        <Media
          alt={order.customer_name}
          ratio="square"
          badge={order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}
        />
        <div className="ds-stack">
          <span className="ds-eyebrow">Copper Pot Kitchen · Order #{order.id}</span>
          <h1 className="ds-card-title">{order.customer_name}'s Order</h1>
          <CardMeta>
            <Icon name="calendar" size={16} /> {createdDate}
            {order.phone ? (
              <>
                {' '}
                <Icon name="phone" size={16} /> {order.phone}
              </>
            ) : null}
          </CardMeta>
          <div className="ds-cluster">
            <Badge tone={order.status === 'completed' ? 'success' : 'primary'}>
              {order.status}
            </Badge>
            <Price value={Number(order.total_amount)} />
          </div>
          {onReorder ? (
            <Button variant="primary" size="lg" onClick={onReorder}>
              <Icon name="refresh" size={18} /> Reorder these items
            </Button>
          ) : null}
        </div>
      </Split>
    </Section>
  );
}