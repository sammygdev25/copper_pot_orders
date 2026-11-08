import React from 'react';
import { Link } from 'react-router-dom';
import {
  Section,
  Grid,
  Card,
  CardBody,
  CardTitle,
  CardMeta,
  CardFooter,
  Badge,
  EmptyState,
  Button,
  SkeletonCards,
} from '../components/ui';
import { Icon } from '../components/icons';
import type { Order } from '../types';

interface OrderHistoryContentProps {
  orders: Order[];
  loading: boolean;
}

function statusTone(status: string): 'neutral' | 'primary' | 'soft' | 'success' | 'danger' {
  switch (status) {
    case 'placed':
      return 'soft';
    case 'preparing':
      return 'primary';
    case 'ready':
      return 'success';
    case 'completed':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export default function OrderHistoryContent({ orders, loading }: OrderHistoryContentProps) {
  if (loading) {
    return (
      <Section title="Your orders" tight>
        <SkeletonCards count={3} />
      </Section>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Section title="Your orders" tight>
        <EmptyState
          icon="package"
          title="No orders yet"
          text="Once you place an order from Copper Pot Kitchen it will show up here with live status updates."
          action={
            <Button to="/menu-items" variant="primary">
              Browse the menu
            </Button>
          }
        />
      </Section>
    );
  }

  return (
    <Section title="Your orders" tight>
      <Grid size="md" cols={3}>
        {(Array.isArray(orders) ? orders : []).map((order) => (
          <Card key={order.id} to={`/orders/${order.id}`}>
            <CardBody>
              <CardTitle>Order #{order.id}</CardTitle>
              <CardMeta>
                <Icon name="calendar" size={14} />
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </CardMeta>
              <CardMeta>
                <Icon name="truck" size={14} />
                {order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}
              </CardMeta>
              <CardFooter>
                <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                <span>${Number(order.total_amount).toFixed(2)}</span>
              </CardFooter>
            </CardBody>
          </Card>
        ))}
      </Grid>
    </Section>
  );
}