import { Info } from 'lucide-react';
import Card from '@/components/ui/Card';
import FortniteUsernameForm from '@/app/(profile)/profile/_components/FortniteUsernameForm';
import AccountSetupProgress from '@/app/(profile)/profile/_components/AccountSetupProgress';
import type { Profile } from '@/types';

export default function FortniteAccountPanel({ profile }: { profile: Profile }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-brand-text">Fortnite акаунт</h2>

      {/* Always-visible explainer */}
      <Card variant="subtle" padding="p-4">
        <div className="flex gap-3">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-brand-muted leading-relaxed">
            <p className="font-semibold text-brand-text text-sm">Как работи процесът?</p>
            <p>
              Скиновете от Item Shop се изпращат като подарък директно в играта чрез
              системата за подаръци на Fortnite.
            </p>
            <p>
              За да получавате подаръци, трябва да сте приятели с нас в Fortnite поне
              <strong className="text-brand-text"> 48 часа</strong> преди да направите поръчка.
            </p>
            <ol className="list-decimal list-inside space-y-0.5 mt-1">
              <li>Въведете вашето Fortnite потребителско име</li>
              <li>Ние ви изпращаме покана за приятелство в играта</li>
              <li>Приемете поканата в Fortnite</li>
              <li>След 48 часа можете да поръчвате скинове</li>
            </ol>
          </div>
        </div>
      </Card>

      {profile.fortnite_username === null ? (
        <Card variant="default" padding="p-6">
          <FortniteUsernameForm />
        </Card>
      ) : (
        <>
          <Card variant="default" padding="p-6">
            <p className="text-xs text-brand-muted mb-1">Fortnite потребителско име</p>
            <p className="text-base font-semibold text-brand-text">
              {profile.fortnite_username}
            </p>
          </Card>

          <Card variant="default" padding="p-6">
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-4">
              Напредък
            </p>
            <AccountSetupProgress profile={profile} />
          </Card>
        </>
      )}
    </div>
  );
}
