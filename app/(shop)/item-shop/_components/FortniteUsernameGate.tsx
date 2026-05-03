import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface FortniteUsernameGateProps {
  /**
   * Where the "set my username" CTA points. Defaults to `/wallet` because
   * that's where the username form lives — pages can override if they ever
   * surface the gate from a different context.
   */
  ctaHref?: string;
}

/**
 * Placeholder shown to users who are signed in but haven't yet linked a
 * Fortnite username to their profile. Shop pages render this in place of
 * their normal content until the user fills in the username.
 *
 * Pure presentational — the gating decision happens server-side in the
 * page that renders this component.
 */
export default function FortniteUsernameGate({
  ctaHref = '/wallet',
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
