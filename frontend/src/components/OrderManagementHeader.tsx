import React from 'react';
import { PageHeader, Badge } from '../components/ui';
import { Icon } from '../components/icons';

export interface OrderManagementHeaderProps {
  pendingCount?: number;
  totalCount?: number;
}

export default function OrderManagementHeader({ pendingCount = 0, totalCount = 0 }: OrderManagementHeaderProps) {
  return (
    <PageHeader
      eyebrow="Copper Pot Kitchen · Staff"
      title="Order Management"
      subtitle="Track incoming tickets and move them from placed to preparing, ready and completed."
      actions={
        <div className="ds-cluster">
          <Badge tone="primary">
            <Icon name="package" size={14} /> {totalCount} total
          </Badge>
          <Badge tone="soft">
            <Icon name="clock" size={14} /> {pendingCount} pending
          </Badge>
        </div>
      }
    />
  );
}