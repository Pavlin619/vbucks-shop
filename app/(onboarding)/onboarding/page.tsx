import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { syncProfile, getProfile } from '@/services/wallet';
import Card from '@/components/ui/Card';
import PhoneNumberForm from '@/app/(onboarding)/onboarding/_components/PhoneNumberForm';

export const metadata = {
  title: 'Настройка на профил · VBucks Shop',
};

export default async function OnboardingPage() {
  const { userId, sessionClaims } = await auth.protect();

  if (sessionClaims?.metadata?.onboardingComplete) {
    redirect('/profile');
  }

  // Idempotent upsert — creates the row if the user.created webhook hasn't fired yet
  await syncProfile(userId);
  const profile = await getProfile(userId);

  return (
    <main className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-text mb-2">
            Последна стъпка
          </h1>
          <p className="text-sm text-brand-muted">
            Добавете телефонен номер за връзка при нужда от наша страна.
          </p>
        </div>

        <Card variant="highlight" padding="p-8">
          <PhoneNumberForm initialPhone={profile.phone_number} />
        </Card>
      </div>
    </main>
  );
}
