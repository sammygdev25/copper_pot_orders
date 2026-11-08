import React from 'react';
import { Link } from 'react-router-dom';
import { Section, Grid, Card, CardBody, CardTitle, CardMeta, CardFooter, Price, Media, Button } from '../components/ui';
import { Icon } from '../components/icons';
import type { MenuItem } from '../types';

interface OrderDetailRelatedProps {
  items: MenuItem[];
  onAddToCart?: (item: MenuItem) => void;
}

export default function OrderDetailRelated({ items, onAddToCart }: OrderDetailRelatedProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const related = items.slice(0, 6);

  return (
    <Section
      eyebrow="You might also like"
      title="More from Copper Pot Kitchen"
      subtitle="Round out your order with a few more favorites from the menu."
    >
      <Grid size="sm">
        {(Array.isArray(related) ? related : []).map((item) => (
          <Card key={item.id} to="/menu-items">
            <Media src={item.image || ''} alt={item.name} ratio="wide" />
            <CardBody>
              <CardTitle>{item.name}</CardTitle>
              <CardMeta>{item.description || 'A Copper Pot Kitchen favorite.'}</CardMeta>
              <CardFooter>
                <Price value={Number(item.price)} />
                <Button
                  variant="secondary"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    if (onAddToCart) onAddToCart(item);
                  }}
                >
                  <Icon name="plus" size={16} />
                  Add
                </Button>
              </CardFooter>
            </CardBody>
          </Card>
        ))}
      </Grid>
      <Link to="/menu-items" className="ds-small">
        Browse the full menu
      </Link>
    </Section>
  );
}