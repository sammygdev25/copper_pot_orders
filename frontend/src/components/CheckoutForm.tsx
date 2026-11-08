import React, { useState, FormEvent } from 'react';
import { Button, Icon } from './ui';

export interface CheckoutFormValues {
  customer_name: string;
  phone: string;
  address: string;
}

interface CheckoutFormProps {
  orderType: string;
  onOrderTypeChange: (orderType: string) => void;
  onSubmit: (values: CheckoutFormValues) => void;
  initialValues: Partial<CheckoutFormValues>;
}

export default function CheckoutForm({
  orderType,
  onOrderTypeChange,
  onSubmit,
  initialValues,
}: CheckoutFormProps) {
  const [customerName, setCustomerName] = useState(initialValues.customer_name || '');
  const [phone, setPhone] = useState(initialValues.phone || '');
  const [address, setAddress] = useState(initialValues.address || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim() || !phone.trim()) {
      setError('Please provide your name and phone number so we can reach you.');
      return;
    }
    if (orderType === 'delivery' && !address.trim()) {
      setError('Please provide a delivery address.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        customer_name: customerName.trim(),
        phone: phone.trim(),
        address: orderType === 'delivery' ? address.trim() : '',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="ds-form" onSubmit={handleSubmit}>
      <div className="ds-field">
        <label className="ds-label">Order Type</label>
        <div className="ds-cluster">
          <button
            type="button"
            className={`btn ${orderType === 'pickup' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onOrderTypeChange('pickup')}
          >
            <Icon name="package" size={16} /> Pickup
          </button>
          <button
            type="button"
            className={`btn ${orderType === 'delivery' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onOrderTypeChange('delivery')}
          >
            <Icon name="truck" size={16} /> Delivery
          </button>
        </div>
      </div>

      <div className="ds-field">
        <label className="ds-label" htmlFor="checkout-name">Full Name</label>
        <input
          id="checkout-name"
          type="text"
          className="input"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Jane Doe"
        />
      </div>

      <div className="ds-field">
        <label className="ds-label" htmlFor="checkout-phone">Phone Number</label>
        <input
          id="checkout-phone"
          type="tel"
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>

      {orderType === 'delivery' && (
        <div className="ds-field">
          <label className="ds-label" htmlFor="checkout-address">Delivery Address</label>
          <input
            id="checkout-address"
            type="text"
            className="input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, Apt 4B, Springfield"
          />
          <p className="ds-help">We deliver within 5 miles of Copper Pot Kitchen.</p>
        </div>
      )}

      {error && (
        <p className="ds-small" style={{ color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}

      <div className="ds-form-actions">
        <Button type="submit" variant="primary" size="lg" disabled={submitting}>
          {submitting ? 'Placing Order…' : 'Place Order'}
        </Button>
      </div>
    </form>
  );
}