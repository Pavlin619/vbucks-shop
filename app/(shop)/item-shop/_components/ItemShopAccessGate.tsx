import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { AccessGateResult } from '@/services/access-gate';

interface ItemShopAccessGateProps {
  gate: Exclude<AccessGateResult, { allowed: true }>;
  className?: string;
}

export default function ItemShopAccessGate({ gate, className }: ItemShopAccessGateProps) {
  return (
    <Card
      variant="highlight"
      padding="p-6"
      className={className}
      data-testid="item-shop-access-gate"
    >
      <GateContent gate={gate} />
    </Card>
  );
}

function GateContent({ gate }: Pick<ItemShopAccessGateProps, 'gate'>) {
  if (gate.reason === 'unauthenticated') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-brand-text mb-2">
            Как да купите скин
          </h2>
          <ol className="space-y-1 text-sm text-brand-muted list-decimal list-inside">
            <li>
              <span className="text-brand-text font-medium">Влезте в профила си</span>
              {' '}или създайте акаунт
            </li>
            <li>
              <span className="text-brand-text font-medium">Добавете Fortnite потребителско име</span>
              {' '}в профила си
            </li>
            <li>
              <span className="text-brand-text font-medium">Приемете нашата покана за приятелство</span>
              {' '}в играта
            </li>
            <li>
              Изчакайте <span className="text-brand-text font-medium">48 часа</span> след приемане
            </li>
            <li>
              След този период ще можете да купувате скинове от Item Shop и ние ще ви изпращаме поръчките като подаръци в играта
            </li>
          </ol>
        </div>
        <Button as="link" href="/sign-in" size="sm">
          Вход / Регистрация
        </Button>
      </div>
    );
  }

  if (gate.reason === 'no_username') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-brand-text mb-1">
            Добавете Fortnite потребителско име
          </h2>
          <p className="text-sm text-brand-muted">
            За да поръчате скин, трябва да свържете Fortnite акаунта си от профила си.
          </p>
        </div>
        <Button as="link" href="/profile?section=fortnite" size="sm">
          Към профила
        </Button>
      </div>
    );
  }

  if (gate.reason === 'awaiting_friend_request') {
    return (
      <div>
        <h2 className="text-lg font-bold text-brand-text mb-1">
          Очаквайте покана за приятелство
        </h2>
        <p className="text-sm text-brand-muted">
          Администраторът скоро ще ви изпрати покана за приятелство в Fortnite.
          Приемете я в играта, за да отключите достъпа до Item Shop след 48 часа.
        </p>
      </div>
    );
  }

  if (gate.reason === 'friend_request_not_accepted') {
    return (
      <div>
        <h2 className="text-lg font-bold text-brand-text mb-1">
          Приемете поканата за приятелство
        </h2>
        <p className="text-sm text-brand-muted">
          Изпратили сме ви покана за приятелство в Fortnite. Приемете я, за да отключите
          достъпа до Item Shop след 48 часа.
        </p>
      </div>
    );
  }

  if (gate.reason === 'shop_closed') {
    const h = Math.floor(gate.minutesUntilOpen / 60);
    const m = gate.minutesUntilOpen % 60;
    const timeLabel =
      h > 0 && m > 0
        ? `${h} ч. ${m} мин.`
        : h > 0
          ? `${h} ч.`
          : `${m} мин.`;

    return (
      <div>
        <h2 className="text-lg font-bold text-brand-text mb-1">
          Магазинът е временно затворен
        </h2>
        <p className="text-sm text-brand-muted">
          Item Shop се обновява всяка сутрин в 03:00 ч. За да осигурим достатъчно
          време за изпращане на скиновете преди обновяването, не приемаме поръчки
          между 01:00 и 03:00 ч. Ще може да поръчвате скинове отново след{' '}
          <span className="text-brand-accent font-medium">{timeLabel}</span>.
        </p>
      </div>
    );
  }

  // waiting_period
  const timeLabel =
    gate.hoursRemaining === 0
      ? `${gate.minutesRemaining} мин.`
      : gate.minutesRemaining === 0
        ? `${gate.hoursRemaining} ч.`
        : `${gate.hoursRemaining} ч. ${gate.minutesRemaining} мин.`;
  return (
    <div>
      <h2 className="text-lg font-bold text-brand-text mb-1">
        Item Shop се отключва след{' '}
        <span className="text-brand-accent">{timeLabel}</span>
      </h2>
      <p className="text-sm text-brand-muted">
        Приехте поканата ни за приятелство. Изчакайте още{' '}
        {gate.hoursRemaining === 0
          ? `${gate.minutesRemaining} мин.`
          : gate.minutesRemaining === 0
            ? `${gate.hoursRemaining} ч.`
            : `${gate.hoursRemaining} ч. и ${gate.minutesRemaining} мин.`
        }, за да можете да поръчвате скинове.
      </p>
    </div>
  );
}
