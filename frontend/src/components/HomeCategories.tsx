import type { Category } from '../types';
import { Section, Grid, Card, CardBody, CardTitle, CardMeta } from '../components/ui';
import { Icon } from '../components/icons';

interface HomeCategoriesProps {
  categories: Category[];
}

const CATEGORY_ICONS: Array<'book' | 'star' | 'award' | 'sparkle' | 'package' | 'tag'> = [
  'star',
  'award',
  'sparkle',
  'package',
  'tag',
  'book',
];

export default function HomeCategories({ categories }: HomeCategoriesProps) {
  const list = Array.isArray(categories) ? categories : [];

  return (
    <Section
      eyebrow="Explore the menu"
      title="Browse by category"
      subtitle="From hearty mains to comforting sides, find exactly what you're craving from Copper Pot Kitchen."
    >
      {list.length === 0 ? (
        <Grid size="sm" cols={3}>
          <Card>
            <CardBody>
              <Icon name="package" size={28} />
              <CardTitle>Starters</CardTitle>
              <CardMeta>Small plates to share before the main event.</CardMeta>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Icon name="star" size={28} />
              <CardTitle>Mains</CardTitle>
              <CardMeta>Hearty, made-to-order dishes from the kitchen.</CardMeta>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Icon name="sparkle" size={28} />
              <CardTitle>Desserts</CardTitle>
              <CardMeta>A sweet finish to round off your meal.</CardMeta>
            </CardBody>
          </Card>
        </Grid>
      ) : (
        <Grid size="sm" cols={3}>
          {list.map((category, idx) => (
            <Card key={category.id} to={`/menu-items?category=${category.slug}`}>
              <CardBody>
                <Icon name={CATEGORY_ICONS[idx % CATEGORY_ICONS.length]} size={28} />
                <CardTitle>{category.name}</CardTitle>
                <CardMeta>View dishes in this category</CardMeta>
              </CardBody>
            </Card>
          ))}
        </Grid>
      )}
    </Section>
  );
}