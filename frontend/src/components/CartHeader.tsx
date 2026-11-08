import { PageHeader } from '../components/ui';

interface CartHeaderProps {
  itemCount: number;
}

export default function CartHeader({ itemCount }: CartHeaderProps) {
  const subtitle =
    itemCount > 0
      ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'} ready for checkout`
      : 'Your cart is empty — add something delicious from the menu';

  return (
    <PageHeader
      eyebrow="Copper Pot Kitchen"
      title="Your Cart"
      subtitle={subtitle}
    />
  );
}