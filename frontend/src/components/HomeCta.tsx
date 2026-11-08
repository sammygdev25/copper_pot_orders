import React from 'react';
import { Link } from 'react-router-dom';
import { Section, Button } from '../components/ui';
import { Icon } from '../components/icons';

interface HomeCtaProps {
  onBrowse?: () => void;
}

export default function HomeCta({ onBrowse }: HomeCtaProps) {
  return (
    <Section tight>
      <div className="ds-card ds-between">
        <div className="ds-stack">
          <h3 className="ds-card-title">Hungry? Copper Pot Kitchen is ready when you are.</h3>
          <p className="ds-muted">Browse our full menu and get your favorites delivered or ready for pickup tonight.</p>
        </div>
        <Button variant="primary" size="lg" to="/menu-items" onClick={onBrowse}>
          Browse the Menu
          <Icon name="arrow-right" size={18} />
        </Button>
      </div>
    </Section>
  );
}