import { Section, Split, Stack, Card, CardBody } from '../components/ui';
import { Icon } from '../components/icons';

interface HomeAboutProps {
  className?: string;
}

const values = [
  {
    icon: 'award' as const,
    title: 'Family recipes since day one',
    text: 'Copper Pot Kitchen started as a single stovetop and a love for slow-simmered sauces. Every dish on our menu still traces back to those original family recipes.',
  },
  {
    icon: 'sparkle' as const,
    title: 'Made fresh, every order',
    text: 'Nothing sits under a heat lamp. Your order goes into the pan after you place it, so what arrives at your table or doorstep is always fresh off the copper pot.',
  },
  {
    icon: 'truck' as const,
    title: 'Fast pickup and delivery',
    text: 'Track every order from the kitchen to your hands. Whether you are picking up or having it delivered, we keep you posted every step of the way.',
  },
];

export default function HomeAbout({ className }: HomeAboutProps) {
  return (
    <Section
      eyebrow="Our kitchen"
      title="A copper pot, a family recipe, and a lot of patience"
      subtitle="Copper Pot Kitchen brings slow-cooked comfort food to your neighborhood, made to order and delivered hot."
      className={className}
    >
      <Split>
        <Stack gap="md">
          <p className="ds-lead">
            It began with one copper pot passed down through three generations and a
            handful of recipes worth sharing. Today Copper Pot Kitchen cooks every order
            fresh, from simmered stews to hand-tossed dishes, using the same techniques
            and the same unhurried care that started it all.
          </p>
          <p className="ds-muted">
            We believe good food takes time, and good service should never make you wait
            longer than it has to. That is why we built online ordering, live order
            tracking and a kitchen team that treats every ticket like it is for their own
            family.
          </p>
        </Stack>
        <Stack gap="sm">
          {(Array.isArray(values) ? values : []).map((value) => (
            <Card key={value.title}>
              <CardBody>
                <Stack gap="xs">
                  <Icon name={value.icon} size={24} title={value.title} />
                  <h3 className="ds-card-title">{value.title}</h3>
                  <p className="ds-small ds-muted">{value.text}</p>
                </Stack>
              </CardBody>
            </Card>
          ))}
        </Stack>
      </Split>
    </Section>
  );
}