import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Alert from '@/components/ui/Alert';

describe('Alert', () => {
  it('renders children in a rounded panel with the info variant by default', () => {
    render(<Alert data-testid="alert">Heads up</Alert>);
    const el = screen.getByTestId('alert');
    expect(el.className).toContain('rounded-xl');
    expect(el.className).toContain('border-white/15');
    expect(el.getAttribute('role')).toBe('status');
    expect(screen.getByText('Heads up').textContent).toBe('Heads up');
  });

  it('renders the error variant with brand-accent treatment and role="alert"', () => {
    render(
      <Alert variant="error" data-testid="alert">
        boom
      </Alert>,
    );
    const el = screen.getByTestId('alert');
    expect(el.className).toContain('bg-brand-accent/10');
    expect(el.className).toContain('border-brand-border-strong');
    expect(el.getAttribute('role')).toBe('alert');
  });

  it('renders the warning variant with amber treatment and role="alert"', () => {
    render(
      <Alert variant="warning" data-testid="alert">
        careful
      </Alert>,
    );
    const el = screen.getByTestId('alert');
    expect(el.className).toContain('bg-amber-500/10');
    expect(el.getAttribute('role')).toBe('alert');
  });

  it('renders the success variant with green treatment and role="status"', () => {
    render(
      <Alert variant="success" data-testid="alert">
        done
      </Alert>,
    );
    const el = screen.getByTestId('alert');
    expect(el.className).toContain('bg-green-500/10');
    expect(el.getAttribute('role')).toBe('status');
  });

  it('renders an action slot next to the message', () => {
    render(
      <Alert
        variant="error"
        action={<button data-testid="retry">Retry</button>}
      >
        failed
      </Alert>,
    );
    expect(screen.getByText('failed')).toBeTruthy();
    expect(screen.getByTestId('retry')).toBeTruthy();
  });

  it('forwards arbitrary DOM props (className, data-*)', () => {
    render(
      <Alert data-testid="alert" className="mt-4">
        x
      </Alert>,
    );
    expect(screen.getByTestId('alert').className).toContain('mt-4');
  });
});
