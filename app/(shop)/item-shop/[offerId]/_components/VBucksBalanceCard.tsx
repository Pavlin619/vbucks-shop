import Card from '@/components/ui/Card';
import { formatVbucks } from '@/app/(shop)/item-shop/_lib/format';

interface VBucksBalanceCardProps {
  balance: number;
  cost: number;
}

/**
 * Compact summary card shown next to the buy CTA. Always reflects the
 * server-side authoritative balance (FR-004) plus a derived "after
 * purchase" preview so the user knows what the click will cost them.
 *
 * Pure presentational — the gating decision (enabling the buy button)
 * happens in `BuySkinButton`. We only highlight the insufficient state
 * visually here.
 */
export default function VBucksBalanceCard({ balance, cost }: VBucksBalanceCardProps) {
  const sufficient = balance >= cost;
  const remaining = balance - cost;

  return (
    <Card
      variant={sufficient ? 'default' : 'highlight'}
      padding="p-6"
      data-testid="vbucks-balance-card"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold uppercase tracking-wider text-brand-muted">
          Вашите V-Bucks
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold bg-cyan-400 text-brand-dark"
          >
            V
          </span>
          <span
            data-testid="vbucks-balance"
            className="text-2xl font-extrabold text-brand-text"
          >
            {formatVbucks(balance)}
          </span>
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-brand-muted">Цена</span>
          <span className="font-semibold text-brand-text">
            −{formatVbucks(cost)}
          </span>
        </div>
        <div className="flex justify-between border-t border-white/10 pt-2">
          <span className="text-brand-muted">След покупка</span>
          <span
            data-testid="vbucks-balance-after"
            className={
              sufficient
                ? 'font-extrabold text-brand-text'
                : 'font-extrabold text-brand-accent'
            }
          >
            {sufficient ? formatVbucks(remaining) : 'Недостатъчно'}
          </span>
        </div>
      </div>
    </Card>
  );
}
