import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getOrderList } from '../api';
import type { Order } from '../types';
import OrderHistoryHeader from '../components/OrderHistoryHeader';
import OrderHistoryContent from '../components/OrderHistoryContent';
import OrderHistoryDetails from '../components/OrderHistoryDetails';

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getOrderList()
      .then((data) => {
        if (active) setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setOrders([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  return (
    <div className="ds-stack-lg">
      <OrderHistoryHeader
        user={user ? { name: user.username, email: user.email } : null}
        orderCount={orders.length}
      />
      <OrderHistoryContent orders={orders} loading={loading} />
      <OrderHistoryDetails
        user={user ? { username: user.username, email: user.email } : null}
        orderCount={orders.length}
        totalSpent={totalSpent}
      />
    </div>
  );
}
