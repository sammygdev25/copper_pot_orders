import React from 'react';
import type { Order, OrderItem } from '../types';
import { Card, CardBody, CardTitle, CardMeta, CardFooter, Button, Stack, Cluster, Price } from '../components/ui';
import { Icon } from '../components/icons';
import OrderStatusBadge from './OrderStatusBadge';

interface StaffOrderCardProps {
  order: Order;
  items?: OrderItem[];
  onStatusChange: (orderId: number, status: string) => void;
}

const STATUS_FLOW: Record<string, string> = {
  placed: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};

const STATUS_ACTION_LABEL: Record<string, string> = {
  placed: 'Start Preparing',
  preparing: 'Mark Ready',
  ready: 'Mark Completed',
};

export default function StaffOrderCard({ order, items, onStatusChange }: StaffOrderCardProps) {
  const nextStatus = STATUS_FLOW[order.status];
  const orderItems = Array.isArray(items) ? items : [];
  const itemCount = orderItems.reduce((sum: number, item: OrderItem) => sum + (item.quantity || 0), 0);

  const createdLabel = order.created_at
    ? new Date(order.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';

  return (
    <Card className="staff-order-card">
      <CardBody>
        <Cluster justify="between" align="start">
          <CardTitle>Order #{order.id}</CardTitle>
          <OrderStatusBadge status={order.status} />
        </Cluster>
        <CardMeta>
          <Icon name="user" size={14} /> {order.customer_name}
        </CardMeta>
        <CardMeta>
          <Icon name="phone" size={14} /> {order.phone}
        </CardMeta>
        <CardMeta>
          <Icon name={order.order_type === 'delivery' ? 'truck' : 'package'} size={14} />{' '}
          {order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}
        </CardMeta>
        {order.order_type === 'delivery' && order.address && (
          <CardMeta>
            <Icon name="map-pin" size={14} /> {order.address}
          </CardMeta>
        )}
        <CardMeta>
          <Icon name="clock" size={14} /> {createdLabel} &middot; {itemCount} item{itemCount !== 1 ? 's' : ''}
        </CardMeta>
        <Stack gap="xs">
          {orderItems.map((item) => (
            <div key={item.id} className="staff-order-card-item">
              <span>{item.quantity}&times; Item #{item.menu_item}</span>
            </div>
          ))}
        </Stack>
      </CardBody>
      <CardFooter>
        <Cluster justify="between" align="center">
          <Price value={Number(order.total_amount)} />
          {nextStatus ? (
            <Button
              variant="primary"
              onClick={() => onStatusChange(order.id, nextStatus)}
            >
              {STATUS_ACTION_LABEL[order.status]}
            </Button>
          ) : (
            <span className="ds-muted ds-small">
              <Icon name="check" size={14} /> Completed
            </span>
          )}
        </Cluster>
      </CardFooter>
    </Card>
  );
}
