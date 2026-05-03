import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '@/components/ui/Card';

describe('Card', () => {
  it('renders children inside a rounded purple panel by default', () => {
    render(
      <Card data-testid="panel">
        <p>hello</p>
      </Card>,
    );

    const panel = screen.getByTestId('panel');
    expect(panel.className).toContain('rounded-2xl');
    expect(panel.className).toContain('bg-brand-purple');
    expect(screen.getByText('hello').textContent).toBe('hello');
  });

  it('adds an accent border in the highlight variant', () => {
    render(<Card variant="highlight" data-testid="panel">x</Card>);
    expect(screen.getByTestId('panel').className).toContain('border-brand-accent');
  });

  it('honours a custom padding utility', () => {
    render(<Card padding="p-10" data-testid="panel">x</Card>);
    expect(screen.getByTestId('panel').className).toContain('p-10');
  });

  it('forwards arbitrary props (className, onClick, data-*)', () => {
    render(
      <Card data-testid="panel" className="extra-class" onClick={() => {}}>
        x
      </Card>,
    );
    expect(screen.getByTestId('panel').className).toContain('extra-class');
  });
});
