import React from 'react';
import { Section, WithSidebar, EmptyState, Button, Media, Icon } from '../components/ui';
import type { CartItem } from '../contexts/CartContext';

interface CartItemsProps {
  items: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
  sidebar?: React.ReactNode;
}

export default function CartItems({ items, onUpdateQuantity, onRemove, sidebar }: CartItemsProps) {
  const content = items.length === 0 ? (
    <EmptyState
      icon="cart"
      title="Your cart is empty"
      text="Browse the Copper Pot Kitchen menu and add something delicious to get started."
      action={<Button to="/menu-items" variant="primary">Browse Menu</Button>}
    />
  ) : (
    <div className="ds-table-wrap">
      <table className="ds-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(items) ? items : []).map((item) => (
            <tr key={item.id}>
              <td>
                <div className="ds-cluster">
                  <Media alt={item.name} ratio="square" />
                  <span>{item.name}</span>
                </div>
              </td>
              <td>${Number(item.price || 0).toFixed(2)}</td>
              <td>
                <div className="ds-cluster">
                  <Button
                    variant="ghost"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    <Icon name="minus" size={16} />
                  </Button>
                  <span>{item.quantity}</span>
                  <Button
                    variant="ghost"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    <Icon name="plus" size={16} />
                  </Button>
                </div>
              </td>
              <td>${(item.price * item.quantity).toFixed(2)}</td>
              <td>
                <Button
                  variant="ghost"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Remove ${item.name} from cart`}
                >
                  <Icon name="trash" size={16} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Section title="Your Order" tight>
      <WithSidebar sidebar={sidebar}>
        {content}
      </WithSidebar>
    </Section>
  );
}