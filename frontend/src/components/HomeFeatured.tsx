import type { MenuItem } from '../types';
import { Section, Grid, Card, CardBody, CardTitle, CardMeta, CardFooter, Price, Badge, Button, SkeletonCards, EmptyState } from '../components/ui';
import { Icon } from '../components/icons';

interface HomeFeaturedProps {
  items: MenuItem[];
  loading: boolean;
  onAddToCart: (item: MenuItem) => void;
}

export default function HomeFeatured({ items, loading, onAddToCart }: HomeFeaturedProps) {
  const featured = (Array.isArray(items) ? items : []).slice(0, 8);

  return (
    <Section
      eyebrow="From the kitchen"
      title="Featured dishes"
      subtitle="A taste of what Copper Pot Kitchen is cooking up today"
    >
      {loading ? (
        <SkeletonCards count={6} />
      ) : featured.length === 0 ? (
        <EmptyState
          icon="package"
          title="No dishes available yet"
          text="Our menu is being updated — check back shortly for fresh favorites."
        />
      ) : (
        <Grid size="md" cols={4}>
          {featured.map((item) => (
            <Card key={item.id}>
              <Media
                src={item.image || ''}
                alt={item.name}
                ratio="wide"
                badge={!item.is_available ? 'Sold out' : undefined}
              />
              <CardBody>
                <CardTitle>{item.name}</CardTitle>
                <CardMeta>{item.description || 'A Copper Pot Kitchen favorite'}</CardMeta>
                <CardFooter>
                  <Price value={item.price} />
                  {item.is_available ? (
                    <Button
                      variant="primary"
                      onClick={() => onAddToCart(item)}
                    >
                      <Icon name="cart" size={16} /> Add
                    </Button>
                  ) : (
                    <Badge tone="neutral">Unavailable</Badge>
                  )}
                </CardFooter>
              </CardBody>
            </Card>
          ))}
        </Grid>
      )}
    </Section>
  );
}

function Media({ src, alt, ratio, badge }: { src: string; alt: string; ratio: 'wide'; badge?: string }) {
  return (
    <div className="ds-media ds-media-wide">
      {src ? (
        <img src={src} alt={alt} className="ds-media-img" />
      ) : (
        <div className="ds-media-fallback">{alt.charAt(0)}</div>
      )}
      {badge && <span className="ds-media-badge">{badge}</span>}
    </div>
  );
}