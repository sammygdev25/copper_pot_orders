import { Button, Price, Stack } from '../components/ui';
import { Icon } from '../components/icons';

interface CartSummaryProps {
  subtotal: number;
  deliveryFee?: number;
  total: number;
  itemCount: number;
  orderType: string;
  onCheckout: () => void;
  checkoutDisabled?: boolean;
}

export default function CartSummary({
  subtotal,
  deliveryFee = 0,
  total,
  itemCount,
  orderType,
  onCheckout,
  checkoutDisabled = false,
}: CartSummaryProps) {
  return (
    <div className="ds-card ds-card-body">
      <h2 className="ds-card-title">Order Summary</h2>
      <Stack gap="sm">
        <div className="ds-between">
          <span className="ds-muted">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <Price value={subtotal} />
        </div>
        {orderType === 'delivery' && (
          <div className="ds-between">
            <span className="ds-muted">Delivery fee</span>
            <Price value={deliveryFee} />
          </div>
        )}
        <div className="ds-between">
          <span className="ds-muted">
            <Icon name={orderType === 'delivery' ? 'truck' : 'package'} size={16} />{' '}
            {orderType === 'delivery' ? 'Delivery' : 'Pickup'}
          </span>
        </div>
        <div className="ds-divider" />
        <div className="ds-between">
          <span className="ds-card-title">Total</span>
          <Price value={total} />
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={onCheckout}
          disabled={checkoutDisabled || itemCount === 0}
        >
          <Icon name="credit-card" size={18} /> Proceed to Checkout
        </Button>
        <p className="ds-small ds-muted">
          Copper Pot Kitchen prepares every order fresh — pickup or delivery, your total is locked in at checkout.
        </p>
      </Stack>
    </div>
  );
}