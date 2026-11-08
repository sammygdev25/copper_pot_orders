import React from 'react';
import { Button } from '../components/ui';
import { Icon } from '../components/icons';
import type { CartItem } from '../contexts/CartContext';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

export default function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const lineTotal = item.price * item.quantity;

  const handleDecrease = () => {
    onUpdateQuantity(item.id, item.quantity - 1);
  };

  const handleIncrease = () => {
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  return (
    <div className="ds-between cart-item-row">
      <div className="ds-stack" style={{ gap: 'var(--space-xs)' }}>
        <span className="ds-card-title">{item.name}</span>
        <span className="ds-muted ds-small">${Number(item.price || 0).toFixed(2)} each</span>
      </div>

      <div className="ds-cluster" style={{ gap: 'var(--space-md)', alignItems: 'center' }}>
        <div className="ds-cluster" style={{ gap: 'var(--space-xs)', alignItems: 'center' }}>
          <Button
            variant="ghost"
            size="md"
            onClick={handleDecrease}
            aria-label={`Decrease quantity of ${item.name}`}
          >
            <Icon name="minus" size={16} />
          </Button>
          <span className="ds-small" style={{ minWidth: '1.5rem', textAlign: 'center' }}>
            {item.quantity}
          </span>
          <Button
            variant="ghost"
            size="md"
            onClick={handleIncrease}
            aria-label={`Increase quantity of ${item.name}`}
          >
            <Icon name="plus" size={16} />
          </Button>
        </div>

        <span className="ds-price">${Number(lineTotal || 0).toFixed(2)}</span>

        <Button
          variant="ghost"
          size="md"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name} from cart`}
        >
          <Icon name="trash" size={16} />
        </Button>
      </div>
    </div>
  );
}