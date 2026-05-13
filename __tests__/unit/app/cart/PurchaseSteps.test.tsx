import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/hooks/use-save-fortnite-username', () => ({
  useSaveFortniteUsername: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn(), push: vi.fn() })),
}));

import { useSaveFortniteUsername } from '@/lib/hooks/use-save-fortnite-username';
import PurchaseSteps from '@/app/(shop)/cart/_components/PurchaseSteps';

const mockUseSaveUsername = vi.mocked(useSaveFortniteUsername);

const defaultSaveHook = {
  saving: false,
  error: null,
  saveUsername: vi.fn(),
};

const noop = () => {};

describe('PurchaseSteps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSaveUsername.mockReturnValue(defaultSaveHook);
  });

  describe('unauthenticated user', () => {
    it('renders sign-in and sign-up links in step 1', () => {
      render(
        <PurchaseSteps
          isAuthenticated={false}
          fortniteUsername={null}
          onCheckout={noop}
          checkoutLoading={false}
          checkoutError={null}
        />,
      );

      expect(screen.getByTestId('step-signin-link')).toBeTruthy();
      expect(screen.getByTestId('step-signup-link')).toBeTruthy();
    });

    it('does not render the username input', () => {
      render(
        <PurchaseSteps
          isAuthenticated={false}
          fortniteUsername={null}
          onCheckout={noop}
          checkoutLoading={false}
          checkoutError={null}
        />,
      );

      expect(screen.queryByTestId('fortnite-username-input')).toBeNull();
    });

    it('renders the checkout button as disabled', () => {
      render(
        <PurchaseSteps
          isAuthenticated={false}
          fortniteUsername={null}
          onCheckout={noop}
          checkoutLoading={false}
          checkoutError={null}
        />,
      );

      const btn = screen.getByTestId('checkout-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  describe('authenticated user without Fortnite username', () => {
    it('does not render sign-in links', () => {
      render(
        <PurchaseSteps
          isAuthenticated={true}
          fortniteUsername={null}
          onCheckout={noop}
          checkoutLoading={false}
          checkoutError={null}
        />,
      );

      expect(screen.queryByTestId('step-signin-link')).toBeNull();
    });

    it('renders the username input and save button', () => {
      render(
        <PurchaseSteps
          isAuthenticated={true}
          fortniteUsername={null}
          onCheckout={noop}
          checkoutLoading={false}
          checkoutError={null}
        />,
      );

      expect(screen.getByTestId('fortnite-username-input')).toBeTruthy();
      expect(screen.getByTestId('save-username-btn')).toBeTruthy();
    });

    it('save button is disabled when input is empty', () => {
      render(
        <PurchaseSteps
          isAuthenticated={true}
          fortniteUsername={null}
          onCheckout={noop}
          checkoutLoading={false}
          checkoutError={null}
        />,
      );

      const saveBtn = screen.getByTestId('save-username-btn') as HTMLButtonElement;
      expect(saveBtn.disabled).toBe(true);
    });

    it('calls saveUsername with the input value when save is clicked', async () => {
      const saveUsername = vi.fn();
      mockUseSaveUsername.mockReturnValue({ ...defaultSaveHook, saveUsername });

      render(
        <PurchaseSteps
          isAuthenticated={true}
          fortniteUsername={null}
          onCheckout={noop}
          checkoutLoading={false}
          checkoutError={null}
        />,
      );

      await userEvent.type(screen.getByTestId('fortnite-username-input'), 'NinjaPlayer');
      await userEvent.click(screen.getByTestId('save-username-btn'));

      expect(saveUsername).toHaveBeenCalledWith('NinjaPlayer');
    });

    it('checkout button is disabled', () => {
      render(
        <PurchaseSteps
          isAuthenticated={true}
          fortniteUsername={null}
          onCheckout={noop}
          checkoutLoading={false}
          checkoutError={null}
        />,
      );

      const btn = screen.getByTestId('checkout-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it('shows save error when hook returns one', () => {
      mockUseSaveUsername.mockReturnValue({
        ...defaultSaveHook,
        error: 'Invalid username',
      });

      render(
        <PurchaseSteps
          isAuthenticated={true}
          fortniteUsername={null}
          onCheckout={noop}
          checkoutLoading={false}
          checkoutError={null}
        />,
      );

      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Invalid username');
    });
  });

  describe('authenticated user with Fortnite username set', () => {
    it('shows the linked username and no input', () => {
      render(
        <PurchaseSteps
          isAuthenticated={true}
          fortniteUsername="NinjaPlayer"
          onCheckout={noop}
          checkoutLoading={false}
          checkoutError={null}
        />,
      );

      expect(screen.getByText('NinjaPlayer')).toBeTruthy();
      expect(screen.queryByTestId('fortnite-username-input')).toBeNull();
    });

    it('checkout button is enabled', () => {
      render(
        <PurchaseSteps
          isAuthenticated={true}
          fortniteUsername="NinjaPlayer"
          onCheckout={noop}
          checkoutLoading={false}
          checkoutError={null}
        />,
      );

      const btn = screen.getByTestId('checkout-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    it('calls onCheckout when checkout button is clicked', async () => {
      const onCheckout = vi.fn();

      render(
        <PurchaseSteps
          isAuthenticated={true}
          fortniteUsername="NinjaPlayer"
          onCheckout={onCheckout}
          checkoutLoading={false}
          checkoutError={null}
        />,
      );

      await userEvent.click(screen.getByTestId('checkout-btn'));
      expect(onCheckout).toHaveBeenCalledTimes(1);
    });

    it('disables checkout button while loading', () => {
      render(
        <PurchaseSteps
          isAuthenticated={true}
          fortniteUsername="NinjaPlayer"
          onCheckout={noop}
          checkoutLoading={true}
          checkoutError={null}
        />,
      );

      const btn = screen.getByTestId('checkout-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      expect(btn.textContent).toContain('Зареждане');
    });

    it('shows transient checkout error with a retry button', async () => {
      const onCheckout = vi.fn();
      render(
        <PurchaseSteps
          isAuthenticated={true}
          fortniteUsername="NinjaPlayer"
          onCheckout={onCheckout}
          checkoutLoading={false}
          checkoutError={{ kind: 'transient', message: 'Payment service unavailable' }}
        />,
      );

      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Неуспешно плащане');

      const retry = screen.getByRole('button', { name: 'Опитайте отново' });
      await userEvent.click(retry);
      expect(onCheckout).toHaveBeenCalled();
    });

    it('shows the no_username variant with a profile link', () => {
      render(
        <PurchaseSteps
          isAuthenticated={true}
          fortniteUsername="NinjaPlayer"
          onCheckout={noop}
          checkoutLoading={false}
          checkoutError={{ kind: 'no_username', message: 'fortnite_username_required' }}
        />,
      );

      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Задайте Fortnite');
      expect(screen.getByRole('link', { name: 'Профил' }).getAttribute('href')).toBe('/profile');
    });

    it('shows the invalid_cart variant with the backend message', () => {
      render(
        <PurchaseSteps
          isAuthenticated={true}
          fortniteUsername="NinjaPlayer"
          onCheckout={noop}
          checkoutLoading={false}
          checkoutError={{ kind: 'invalid_cart', message: 'Invalid packId: bogus' }}
        />,
      );

      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Invalid packId: bogus');
    });
  });
});
