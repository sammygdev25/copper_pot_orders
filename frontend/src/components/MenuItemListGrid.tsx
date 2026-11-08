import type { MenuItem } from '../types';
import { Section, Grid, Card, CardBody, CardTitle, CardMeta, Media, Price, Badge, Button, SkeletonCards, EmptyState } from '../components/ui';
import { Icon } from '../components/icons';

interface MenuItemListGridProps {
  items: MenuItem[];
  loading: boolean;
  onAddToCart: (item: MenuItem) => void;
}

export default function MenuItemListGrid({ items, loading, onAddToCart }: MenuItemListGridProps) {
  if (loading) {
    return (
      <Section title="Our Dishes" subtitle="Freshly prepared, made to order">
        <SkeletonCards count={8} />
      </Section>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Section title="Our Dishes" subtitle="Freshly prepared, made to order">
        <EmptyState
          icon="package"
          title="No dishes found"
          text="Try a different category or clear your search to see the full Copper Pot Kitchen menu."
        />
      </Section>
    );
  }

  return (
    <Section title="Our Dishes" subtitle="Freshly prepared, made to order">
      <Grid size="md" cols={4}>
        {(Array.isArray(items) ? items : []).map((item) => (
          <Card key={item.id}>
            <Media
              src={item.image || ''}
              alt={item.name}
              ratio="square"
              badge={!item.is_available ? 'Sold out' : undefined}
            />
            <CardBody>
              <CardTitle>{item.name}</CardTitle>
              <CardMeta>{item.description}</CardMeta>
              <div className="ds-between">
                <Price value={item.price} />
                {!item.is_available && <Badge tone="danger">Unavailable</Badge>}
              </div>
              <div className="ds-form-actions">
                <Button
                  variant="primary"
                  disabled={!item.is_available}
                  onClick={() => onAddToCart(item)}
                >
                  <Icon name="cart" size={16} /> Add to cart
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </Grid>
    </Section>
  );
}