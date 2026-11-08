import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder, getOrderItemList, getMenuItemList } from '../api';
import type { Order, OrderItem, MenuItem } from '../types';
import { useCart } from '../contexts/CartContext';
import OrderDetailMedia from '../components/OrderDetailMedia';
import OrderDetailFacts from '../components/OrderDetailFacts';
import OrderItemsList from '../components/OrderItemsList';
import OrderDetailRelated from '../components/OrderDetailRelated';
import { LoadingBlock, Alert, Section } from '../components/ui';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderedMenuItems, setOrderedMenuItems] = useState<MenuItem[]>([]);
  const [relatedItems, setRelatedItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const data = await getOrder(Number(id));
        if (cancelled) return;
        setOrder(data);

        const items = await getOrderItemList({ order: data.id });
        if (cancelled) return;
        setOrderItems(Array.isArray(items) ? items : []);

        const menuItems = await getMenuItemList();
        if (cancelled) return;

        const orderedMenuIds = new Set(
          (Array.isArray(items) ? items : []).map((i) => i.menu_item)
        );
        const orderedMenuItemObjs = (Array.isArray(menuItems) ? menuItems : []).filter((m) =>
          orderedMenuIds.has(m.id)
        );
        setOrderedMenuItems(orderedMenuItemObjs);

        const categoryIds = new Set(
          (Array.isArray(orderedMenuItemObjs) ? orderedMenuItemObjs : []).map((m) => m.category)
        );
        const related = menuItems
          .filter(
            (m) => categoryIds.has(m.category) && !orderedMenuIds.has(m.id)
          )
          .slice(0, 6);
        setRelatedItems(related);
      } catch (err) {
        if (!cancelled) {
          setError('Could not load this order. It may not exist or you may not have access to it.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrder();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleReorder = async () => {
    if (!order) return;
    for (const item of orderItems) {
      const menuItem = orderedMenuItems.find((m) => m.id === item.menu_item);
      if (menuItem) {
        addItem(menuItem, item.quantity);
      }
    }
    navigate('/cart');
  };

  const handleAddToCart = (item: MenuItem) => {
    addItem(item, 1);
  };

  if (loading) {
    return (
      <Section>
        <LoadingBlock label="Loading your order..." />
      </Section>
    );
  }

  if (error || !order) {
    return (
      <Section>
        <Alert tone="danger">
          {error || 'Order not found.'}
        </Alert>
      </Section>
    );
  }

  return (
    <div className="ds-stack-lg">
      <OrderDetailMedia order={order} onReorder={handleReorder} />
      <OrderDetailFacts order={order} />
      <Section eyebrow="Order contents" title="Items in this order">
        <OrderItemsList items={orderItems} />
      </Section>
      {relatedItems.length > 0 && (
        <OrderDetailRelated items={relatedItems} onAddToCart={handleAddToCart} />
      )}
    </div>
  );
}
