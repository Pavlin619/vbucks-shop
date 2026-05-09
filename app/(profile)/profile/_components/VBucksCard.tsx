import Image from 'next/image';
import Card from '@/components/ui/Card';

export default function VBucksCard({ balance }: { balance: number }) {
  return (
    <Card variant="subtle" padding="p-4">
      <div className="flex items-center gap-3">
        <Image
          src="/vbucks-coin.jpg"
          alt="V-Bucks"
          width={40}
          height={40}
          className="rounded-full shrink-0"
        />
        <div>
          <p className="text-xs font-semibold text-brand-text">V-Bucks Balance</p>
          <p className="text-lg font-bold text-brand-text leading-tight">
            {balance.toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
}
