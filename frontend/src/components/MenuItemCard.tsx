import type { MenuItem } from '../types';
import { Card, CardBody, CardTitle, CardMeta, CardFooter, Price, Media, Badge, Button } from '../components/ui';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export default function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  const available = item.is_available;

  return (
    <Card className="ds-card">
      <Media
        src={item.image || ''}
        alt={item.name}
        ratio="wide"
        badge={!available ? <Badge tone="danger">Sold out</Badge> : undefined}
      />
      <CardBody>
        <CardTitle>{item.name}</CardTitle>
        {item.description && <CardMeta>{item.description}</CardMeta>}
        <CardFooter>
          <Price value={item.price} />
          <Button
            variant="primary"
            disabled={!available}
            onClick={() => onAddToCart(item)}
          >
            {available ? 'Add to cart' : 'Unavailable'}
          </Button>
        </CardFooter>
      </CardBody>
    </Card>
  );
}