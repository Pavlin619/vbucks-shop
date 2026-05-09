import { Check, Clock, UserPlus, ShoppingBag, User } from 'lucide-react';
import type { Profile } from '@/types';

interface AccountSetupProgressProps {
  profile: Profile;
}

type StepStatus = 'done' | 'active' | 'pending';

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  status: StepStatus;
}

const GATE_HOURS = 48;

function getWaitingPeriodState(acceptedAt: string | null): {
  status: StepStatus;
  timeLabel?: string;
} {
  if (!acceptedAt) return { status: 'active' };

  const elapsedMs = Date.now() - new Date(acceptedAt).getTime();
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  if (elapsedHours >= GATE_HOURS) return { status: 'done' };

  const totalMinutes = Math.max(1, Math.ceil((GATE_HOURS - elapsedHours) * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const timeLabel =
    h === 0 ? `${m} мин.` : m === 0 ? `${h} ч.` : `${h} ч. ${m} мин.`;

  return { status: 'active', timeLabel };
}

export default function AccountSetupProgress({ profile }: AccountSetupProgressProps) {
  const { friend_request_status: status, friend_request_accepted_at: acceptedAt } = profile;

  const step4 =
    status === 'accepted'
      ? getWaitingPeriodState(acceptedAt)
      : { status: 'pending' as StepStatus };

  const steps: Step[] = [
    {
      icon: User,
      title: 'Fortnite потребителско име',
      description: 'Потребителското ви име е регистрирано.',
      status: 'done',
    },
    {
      icon: UserPlus,
      title: 'Покана за приятелство',
      description:
        status === 'not_sent'
          ? 'Администраторите ще ви изпратят покана в Fortnite в най-кратко време.'
          : 'Поканата е изпратена.',
      status:
        status === 'not_sent'
          ? 'active'
          : 'done',
    },
    {
      icon: Check,
      title: 'Приемете поканата',
      description:
        status === 'pending'
          ? 'Отворете Fortnite и приемете поканата за приятелство от нас.'
          : status === 'accepted'
          ? 'Поканата е приета.'
          : 'Изчакайте поканата от администраторите.',
      status:
        status === 'pending'
          ? 'active'
          : status === 'accepted'
          ? 'done'
          : 'pending',
    },
    {
      icon: step4.status === 'done' ? ShoppingBag : Clock,
      title: step4.status === 'done' ? 'Готово — можете да купувате!' : 'Изчакайте 48 часа',
      description:
        step4.status === 'done'
          ? 'Item Shop е отключен. Разглеждайте и поръчвайте скинове!'
          : step4.status === 'active' && step4.timeLabel
          ? `Остават ${step4.timeLabel} до отключването на Item Shop.`
          : 'Следва след приемане на поканата.',
      status: step4.status,
    },
  ];

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const Icon = step.icon;

        return (
          <div key={i} className="flex gap-4">
            {/* Timeline column */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  step.status === 'done'
                    ? 'bg-green-500'
                    : step.status === 'active'
                    ? 'bg-brand-accent'
                    : 'bg-brand-purple border border-white/15'
                }`}
              >
                {step.status === 'done' ? (
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                ) : (
                  <Icon
                    className={`w-4 h-4 ${
                      step.status === 'active' ? 'text-white' : 'text-brand-muted'
                    }`}
                  />
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-px flex-1 my-1 ${
                    step.status === 'done' ? 'bg-green-500/40' : 'bg-white/10'
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 flex-1 ${isLast ? 'pb-0' : ''}`}>
              <p
                className={`text-sm font-semibold leading-tight ${
                  step.status === 'pending' ? 'text-brand-muted' : 'text-brand-text'
                }`}
              >
                {step.title}
              </p>
              <p
                className={`text-xs mt-0.5 leading-relaxed ${
                  step.status === 'active'
                    ? 'text-brand-text'
                    : 'text-brand-muted'
                }`}
              >
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
