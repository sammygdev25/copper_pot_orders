import { PageHeader } from '../components/ui';

interface MenuItemListHeaderProps {
  resultCount?: number;
  loading?: boolean;
}

export default function MenuItemListHeader({ resultCount, loading }: MenuItemListHeaderProps) {
  const subtitle = loading
    ? 'Loading our menu...'
    : typeof resultCount === 'number'
      ? `${resultCount} ${resultCount === 1 ? 'dish' : 'dishes'} ready to order`
      : 'Fresh, made-to-order dishes from Copper Pot Kitchen';

  return (
    <PageHeader
      eyebrow="Our Menu"
      title="Browse the Full Menu"
      subtitle={subtitle}
    />
  );
}