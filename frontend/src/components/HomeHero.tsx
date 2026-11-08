import { Button, Media, Section } from '../components/ui';
import { Icon } from '../components/icons';

interface HomeHeroProps {
  heroImage?: string;
}

export default function HomeHero({ heroImage }: HomeHeroProps) {
  return (
    <Section tight>
      <div className="ds-grid-split ds-hero">
        <div className="ds-stack">
          <span className="ds-eyebrow">
            <Icon name="award" size={16} /> Copper Pot Kitchen
          </span>
          <h1 className="ds-lead">Scratch-made comfort food, fired up fast.</h1>
          <p>
            Browse our daily menu of slow-braised classics and wood-fired favorites, built fresh
            to order in the Copper Pot kitchen. Order online for pickup or delivery and track
            your meal from the stove to your door.
          </p>
          <div className="ds-cluster">
            <Button variant="primary" size="lg" to="/menu-items">
              View Full Menu
            </Button>
            <Button variant="ghost" size="lg" to="/orders">
              Track an Order
            </Button>
          </div>
        </div>
        {heroImage ? (
          <Media src={heroImage} alt="Signature dish at Copper Pot Kitchen" ratio="wide" />
        ) : null}
      </div>
    </Section>
  );
}