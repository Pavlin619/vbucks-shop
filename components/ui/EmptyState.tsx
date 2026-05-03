import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  testId?: string;
}

export default function EmptyState({ message, testId }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl bg-brand-purple border border-dashed border-white/15"
      data-testid={testId}
    >
      <PackageOpen className="w-10 h-10 mb-4 text-brand-accent" />
      <p className="text-base text-brand-text">{message}</p>
    </div>
  );
}
