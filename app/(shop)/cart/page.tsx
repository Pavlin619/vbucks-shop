import { auth } from '@clerk/nextjs/server';
import Header from '@/components/layout/Header';
import CartContent from '@/app/(shop)/cart/_components/CartContent';
import { getProfile } from '@/services/wallet';

export default async function CartPage() {
  const { userId } = await auth();

  let fortniteUsername: string | null = null;
  if (userId) {
    try {
      const profile = await getProfile(userId);
      fortniteUsername = profile.fortnite_username;
    } catch {
      // Profile not yet synced — treat as no username set.
    }
  }

  return (
    <>
      <Header />
      <CartContent isAuthenticated={!!userId} fortniteUsername={fortniteUsername} />
    </>
  );
}
