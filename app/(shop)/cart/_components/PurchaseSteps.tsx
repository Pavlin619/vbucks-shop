'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useSaveUsername } from '@/app/(shop)/cart/_lib/use-save-username';

type StepStatus = 'completed' | 'active' | 'locked';

interface StepProps {
  number: number;
  status: StepStatus;
  title: string;
  isLast: boolean;
  children?: ReactNode;
}

function Step({ number, status, title, isLast, children }: StepProps) {
  const isCompleted = status === 'completed';
  const isActive = status === 'active';

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={[
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold',
            isCompleted || isActive
              ? 'bg-brand-accent text-brand-text'
              : 'border-2 border-brand-border-strong text-brand-muted',
          ].join(' ')}
        >
          {isCompleted ? <Check className="w-4 h-4" /> : number}
        </div>
        {!isLast && (
          <div
            className={[
              'w-0.5 flex-1 min-h-6 mt-1',
              isCompleted ? 'bg-brand-accent/40' : 'bg-brand-border-strong',
            ].join(' ')}
          />
        )}
      </div>

      <div className={['min-w-0 flex-1', isLast ? 'pb-0' : 'pb-6'].join(' ')}>
        <p
          className={[
            'font-semibold leading-tight',
            isCompleted || isActive ? 'text-brand-text' : 'text-brand-muted',
          ].join(' ')}
        >
          {title}
        </p>
        {children}
      </div>
    </div>
  );
}

interface PurchaseStepsProps {
  isAuthenticated: boolean;
  fortniteUsername: string | null;
  onCheckout: () => void;
  checkoutLoading: boolean;
  checkoutError: string | null;
}

export default function PurchaseSteps({
  isAuthenticated,
  fortniteUsername,
  onCheckout,
  checkoutLoading,
  checkoutError,
}: PurchaseStepsProps) {
  const [usernameInput, setUsernameInput] = useState('');
  const { saving, error: saveError, saveUsername } = useSaveUsername();

  const step1Status: StepStatus = isAuthenticated ? 'completed' : 'active';
  const step2Status: StepStatus = fortniteUsername
    ? 'completed'
    : isAuthenticated
      ? 'active'
      : 'locked';
  const step3Status: StepStatus =
    isAuthenticated && !!fortniteUsername ? 'active' : 'locked';

  return (
    <Card variant="highlight" className="mb-6" data-testid="purchase-steps">
      <h2 className="text-base font-bold text-brand-text mb-5">Как работи покупката</h2>

      <Step number={1} status={step1Status} title="Влез в акаунта си" isLast={false}>
        {step1Status === 'active' && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button as="link" href="/sign-in?redirect_url=/cart" size="sm" data-testid="step-signin-link">
              Вход
            </Button>
            <Button
              as="link"
              href="/sign-up?redirect_url=/cart"
              size="sm"
              variant="secondary"
              data-testid="step-signup-link"
            >
              Регистрация
            </Button>
          </div>
        )}
      </Step>

      <Step
        number={2}
        status={step2Status}
        title="Свържи Fortnite акаунта си"
        isLast={false}
      >
        {step2Status === 'completed' && (
          <p className="mt-1 text-sm text-brand-muted">
            Акаунт:{' '}
            <strong className="text-brand-text">{fortniteUsername}</strong>
          </p>
        )}
        {(step2Status === 'active' || step2Status === 'locked') && (
          <p className="mt-2 text-sm text-brand-muted leading-relaxed">
            Въведи своето Fortnite потребителско, за да можем да ти изпратим покана за
            приятелство. Покана ще бъде изпратена до твоя акаунт в рамките на{' '}
            <strong className="text-brand-text">30 минути</strong>.
            Приеми поканата и изчакай{' '}
            <strong className="text-brand-text">48 часа</strong>, след което ще можеш да
            купуваш скинове от Item Shop.
          </p>
        )}
        {step2Status === 'active' && (
          <div className="mt-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Fortnite потребителско"
                className="flex-1 rounded-xl px-3 py-2 bg-brand-dark text-brand-text border border-brand-border-strong placeholder:text-brand-muted focus:outline-none focus:border-brand-accent text-sm"
                data-testid="fortnite-username-input"
              />
              <Button
                size="sm"
                onClick={() => saveUsername(usernameInput)}
                disabled={saving || !usernameInput.trim()}
                data-testid="save-username-btn"
              >
                {saving ? 'Запис…' : 'Запази'}
              </Button>
            </div>
            {saveError && (
              <p className="mt-2 text-xs text-red-400" role="alert">
                {saveError}
              </p>
            )}
          </div>
        )}
      </Step>

      <Step number={3} status={step3Status} title="Купи V-Bucks" isLast={true}>
        <p className="mt-1 text-sm text-brand-muted">
          Плати с карта и V-Bucks ще бъдат добавени веднага към баланса ти.
        </p>
        {checkoutError && (
          <p className="mt-2 text-sm text-red-400" role="alert">
            {checkoutError}
          </p>
        )}
        <div className="mt-3">
          <Button
            fullWidth
            onClick={onCheckout}
            disabled={checkoutLoading || step3Status === 'locked'}
            data-testid="checkout-btn"
          >
            {checkoutLoading ? 'Зареждане…' : 'Към плащането'}
          </Button>
        </div>
      </Step>
    </Card>
  );
}
