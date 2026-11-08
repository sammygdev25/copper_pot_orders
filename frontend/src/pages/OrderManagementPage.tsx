import React, { useEffect, useState, useCallback } from 'react';
import { getOrderList } from '../api';
import api from '../api';
import type { Order } from '../types';
import OrderManagementHeader from '../components/OrderManagementHeader';
import OrderManagementContent from '../components/OrderManagementContent';

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrderList();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: number, status: string) => {
    const previous = orders;
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    try {
      await api.patch(`/orders/${orderId}/`, { status });
    } catch {
      setOrders(previous);
    }
  };

  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status !== 'completed').length;

  return (
    <div className="ds-stack-lg">
      <OrderManagementHeader pendingCount={pendingCount} totalCount={totalCount} />
      <OrderManagementContent
        orders={orders}
        loading={loading}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}