import Card from '@/components/ui/Card';

interface ProfileCardProps {
  displayName: string;
  email: string;
  initial: string;
}

export default function ProfileCard({ displayName, email, initial }: ProfileCardProps) {
  return (
    <Card variant="subtle" padding="p-4">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-brand-accent flex items-center justify-center text-white text-lg font-bold select-none">
            {initial}
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-brand-purple" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-brand-text truncate">{displayName}</p>
          <p className="text-xs text-brand-muted truncate">{email}</p>
        </div>
      </div>
    </Card>
  );
}
