import { PageHeader } from '../components/ui';

interface MenuManagementHeaderProps {
  itemCount?: number;
  categoryCount?: number;
  loading?: boolean;
}

export default function MenuManagementHeader({ itemCount = 0, categoryCount = 0, loading = false }: MenuManagementHeaderProps) {
  const subtitle = loading
    ? 'Loading your menu...'
    : `${categoryCount} ${categoryCount === 1 ? 'category' : 'categories'} · ${itemCount} ${itemCount === 1 ? 'dish' : 'dishes'} on the menu`;

  return (
    <PageHeader
      eyebrow="Copper Pot Kitchen · Staff"
      title="Menu Management"
      subtitle={`Add, edit and organize the dishes and categories your guests see on the menu. ${subtitle}`}
    />
  );
}