import { Card, CardBody, CardTitle, CardMeta, CardFooter, Price, Badge, Grid, SkeletonCards, EmptyState, Button } from '../components/ui';
import { Icon } from '../components/icons';
import type { MenuItem } from '../types';

interface MenuManagementGridProps {
  items: MenuItem[];
  loading: boolean;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
  onCreate: () => void;
}

export default function MenuManagementGrid({ items, loading, onEdit, onDelete, onCreate }: MenuManagementGridProps) {
  if (loading) {
    return <SkeletonCards count={6} />;
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon="package"
        title="No dishes on the menu yet"
        text="Add Copper Pot Kitchen's first dish to start building the menu."
        action={<Button variant="primary" onClick={onCreate}>Add a dish</Button>}
      />
    );
  }

  return (
    <Grid size="md" cols={3}>
      {(Array.isArray(items) ? items : []).map((item) => (
        <Card key={item.id}>
          <Media src={item.image || ''} alt={item.name} ratio="wide" />
          <CardBody>
            <div className="ds-between">
              <CardTitle>{item.name}</CardTitle>
              <Badge tone={item.is_available ? 'success' : 'danger'}>
                {item.is_available ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
            <CardMeta>{item.description || 'A Copper Pot Kitchen favorite.'}</CardMeta>
            <Price value={item.price} />
            <CardFooter>
              <Button variant="secondary" onClick={() => onEdit(item)}>
                <Icon name="edit" size={16} /> Edit
              </Button>
              <Button variant="danger" onClick={() => onDelete(item.id)}>
                <Icon name="trash" size={16} /> Delete
              </Button>
            </CardFooter>
          </CardBody>
        </Card>
      ))}
    </Grid>
  );
}

function Media({ src, alt, ratio }: { src: string; alt: string; ratio: 'wide' }) {
  return (
    <div className={`ds-media ds-media-${ratio}`}>
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        <div className="ds-empty">
          <Icon name="image" size={32} title={alt} />
        </div>
      )}
    </div>
  );
}