import React from 'react';
import type { Order } from '../types';
import { Card, CardBody, CardTitle, CardMeta, CardFooter, Price, Icon } from '../components/ui';
import OrderStatusBadge from './OrderStatusBadge';

interface OrderCardProps {
  order: Order;
  onClick?: (order: Order) => void;
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
  const itemCount: number = 0;

  const createdDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <Card onClick={onClick ? () => onClick(order) : undefined}>
      <CardBody>
        <div className="ds-between">
          <CardTitle>Order #{order.id}</CardTitle>
          <OrderStatusBadge status={order.status} />
        </div>
        <CardMeta>
          <Icon name="calendar" size={14} /> {createdDate}
          {'  '}
          <Icon name="package" size={14} /> {itemCount} item{itemCount === 1 ? '' : 's'}
          {'  '}
          <Icon name={order.order_type === 'delivery' ? 'truck' : 'map-pin'} size={14} />{' '}
          {order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}
        </CardMeta>
        <CardFooter>
          <Price value={Number(order.total_amount)} />
          {order.paid_at ? (
            <span className="ds-small" style={{ color: 'var(--color-success)' }}>
              Paid
            </span>
          ) : (
            <span className="ds-small" style={{ color: 'var(--color-danger)' }}>
              Unpaid
            </span>
          )}
        </CardFooter>
      </CardBody>
    </Card>
  );
}
