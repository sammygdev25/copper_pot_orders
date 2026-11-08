import React from 'react';
import { Section, Stack, Badge } from '../components/ui';
import { Icon } from '../components/icons';

interface OrderHistoryDetailsUser {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface OrderHistoryDetailsProps {
  user: OrderHistoryDetailsUser | null;
  orderCount: number;
  totalSpent: number;
}

export default function OrderHistoryDetails({ user, orderCount, totalSpent }: OrderHistoryDetailsProps) {
  const displayName =
    user?.first_name || user?.last_name
      ? `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim()
      : user?.username || 'Guest';

  return (
    <Section
      narrow
      eyebrow="Your account"
      title="Account details"
      subtitle="The contact information Copper Pot Kitchen uses for your orders."
    >
      <div className="ds-form">
        <div className="ds-field">
          <span className="ds-label">Name</span>
          <Stack gap="xs" align="start">
            <Icon name="user" size={18} />
            <span>{displayName}</span>
          </Stack>
        </div>

        <div className="ds-field">
          <span className="ds-label">Email</span>
          <Stack gap="xs" align="start">
            <Icon name="mail" size={18} />
            <span>{user?.email || 'Not provided'}</span>
          </Stack>
        </div>

        <div className="ds-field">
          <span className="ds-label">Order history</span>
          <Stack gap="sm" align="center">
            <Badge tone="primary">{orderCount} orders placed</Badge>
            <Badge tone="soft">${Number(totalSpent || 0).toFixed(2)} total spent</Badge>
          </Stack>
          <p className="ds-help">
            Every pickup and delivery order from Copper Pot Kitchen is tracked here, from
            the kitchen's first ticket to the final plate.
          </p>
        </div>
      </div>
    </Section>
  );
}