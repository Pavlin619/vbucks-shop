import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renders a <button> by default and forwards onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Buy</Button>);

    const btn = screen.getByRole('button', { name: 'Buy' });
    expect(btn.tagName).toBe('BUTTON');

    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a Next.js <Link> when as="link" is passed', () => {
    render(
      <Button as="link" href="/cart" data-testid="go-to-cart">
        Към количката
      </Button>,
    );

    const link = screen.getByTestId('go-to-cart');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/cart');
  });

  it('forwards arbitrary DOM props (data-testid, aria-label, disabled)', () => {
    render(
      <Button data-testid="checkout-btn" aria-label="Pay now" disabled>
        Pay
      </Button>,
    );

    const btn = screen.getByTestId('checkout-btn') as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Pay now');
    expect(btn.disabled).toBe(true);
  });

  it('applies the primary variant + brand-accent utilities by default', () => {
    render(<Button>Buy</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-brand-accent');
    expect(btn.className).toContain('hover:bg-brand-accent-hover');
  });

  it('applies the secondary variant when requested', () => {
    render(<Button variant="secondary">Cancel</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-brand-dark');
    expect(btn.className).not.toContain('bg-brand-accent ');
  });

  it('applies fullWidth + size classes', () => {
    render(
      <Button fullWidth size="lg">
        Big
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('w-full');
    expect(btn.className).toContain('px-8');
    expect(btn.className).toContain('py-4');
  });
});
