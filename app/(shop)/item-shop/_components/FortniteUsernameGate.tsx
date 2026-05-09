import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface FortniteUsernameGateProps {
  ctaHref?: string;
}

export default function FortniteUsernameGate({
  ctaHref = '/profile?section=fortnite',
}: FortniteUsernameGateProps) {
  return (
    <Card
      variant="highlight"
      padding="p-10"
      className="text-center"
      data-testid="fortnite-username-gate"
    >
      <h1 className="text-3xl font-bold mb-3 text-brand-text">
        Свържете Fortnite акаунта си
      </h1>
      <p className="mb-8 text-brand-text">
        За да разглеждате и купувате от Item Shop, първо трябва да добавите вашето Fortnite потребителско име към профила си.
      </p>
      <Button as="link" href={ctaHref} data-testid="link-to-wallet">
        Към профила
      </Button>
    </Card>
  );
}
