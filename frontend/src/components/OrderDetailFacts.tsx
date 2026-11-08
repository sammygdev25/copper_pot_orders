import type { Order } from '../types';
import { Section, Grid, Badge } from '../components/ui';
import { Icon } from '../components/icons';

interface OrderDetailFactsProps {
  order: Order;
}

export default function OrderDetailFacts({ order }: OrderDetailFactsProps) {
  const createdAt = order.created_at ? new Date(order.created_at).toLocaleString('en-US') : '—';
  const paidAt = order.paid_at ? new Date(order.paid_at).toLocaleString('en-US') : null;

  return (
    <Section eyebrow="Order details" title="Order information" tight>
      <Grid cols={2} size="sm">
        <div className="ds-card ds-card-body">
          <div className="ds-card-meta">
            <Icon name="package" size={16} /> Order type
          </div>
          <div className="ds-card-title">
            {order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}
          </div>
        </div>

        <div className="ds-card ds-card-body">
          <div className="ds-card-meta">
            <Icon name="user" size={16} /> Customer
          </div>
          <div className="ds-card-title">{order.customer_name}</div>
        </div>

        <div className="ds-card ds-card-body">
          <div className="ds-card-meta">
            <Icon name="phone" size={16} /> Phone
          </div>
          <div className="ds-card-title">{order.phone}</div>
        </div>

        {order.order_type === 'delivery' && order.address ? (
          <div className="ds-card ds-card-body">
            <div className="ds-card-meta">
              <Icon name="map-pin" size={16} /> Delivery address
            </div>
            <div className="ds-card-title">{order.address}</div>
          </div>
        ) : null}

        <div className="ds-card ds-card-body">
          <div className="ds-card-meta">
            <Icon name="calendar" size={16} /> Placed on
          </div>
          <div className="ds-card-title">{createdAt}</div>
        </div>

        <div className="ds-card ds-card-body">
          <div className="ds-card-meta">
            <Icon name="credit-card" size={16} /> Payment
          </div>
          <div className="ds-card-title">
            {paidAt ? (
              <Badge tone="success">Paid {paidAt}</Badge>
            ) : (
              <Badge tone="neutral">Awaiting payment</Badge>
            )}
          </div>
        </div>

        <div className="ds-card ds-card-body">
          <div className="ds-card-meta">
            <Icon name="dollar" size={16} /> Delivery fee
          </div>
          <div className="ds-card-title">${Number(order.delivery_fee || 0).toFixed(2)}</div>
        </div>

        <div className="ds-card ds-card-body">
          <div className="ds-card-meta">
            <Icon name="dollar" size={16} /> Total
          </div>
          <div className="ds-card-title">${Number(order.total_amount || 0).toFixed(2)}</div>
        </div>
      </Grid>
    </Section>
  );
}