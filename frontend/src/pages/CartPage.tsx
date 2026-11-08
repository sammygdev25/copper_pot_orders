import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createOrder } from '../api';
import CartHeader from '../components/CartHeader';
import CartItems from '../components/CartItems';
import CartSummary from '../components/CartSummary';
import CheckoutForm, { CheckoutFormValues } from '../components/CheckoutForm';
import { Alert } from '../components/ui';

const DELIVERY_FEE = 4.99;

export default function CartPage() {
  const { items, total, itemCount, orderType, setOrderType, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showCheckout, setShowCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
  const grandTotal = total + deliveryFee;

  const handleCheckout = async (values: CheckoutFormValues) => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        order_type: orderType,
        customer_name: values.customer_name,
        phone: values.phone,
        address: values.address || '',
        items: (Array.isArray(items) ? items : []).map((item) => ({
          menu_item: item.id,
          quantity: item.quantity,
        })),
      };
      const order = await createOrder(payload);
      clearCart();
      navigate(`/orders/${order.id}`);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          'We could not place your order. Please check your details and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const sidebar = showCheckout ? (
    <div className="ds-stack">
      {error && <Alert tone="danger">{error}</Alert>}
      <CheckoutForm
        orderType={orderType}
        onOrderTypeChange={setOrderType}
        onSubmit={handleCheckout}
        initialValues={{
          customer_name: user?.username || '',
          phone: '',
          address: '',
        }}
      />
    </div>
  ) : (
    <CartSummary
      subtotal={total}
      deliveryFee={deliveryFee}
      total={grandTotal}
      itemCount={itemCount}
      orderType={orderType}
      onCheckout={() => setShowCheckout(true)}
      checkoutDisabled={items.length === 0 || submitting}
    />
  );

  return (
    <div className="ds-stack-lg">
      <CartHeader itemCount={itemCount} />
      <CartItems
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemove={removeItem}
        sidebar={sidebar}
      />
    </div>
  );
}