import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SectionHeading from '@/components/ui/SectionHeading';

describe('SectionHeading', () => {
  it('renders the title as an h2 with brand-text color', () => {
    render(<SectionHeading title="Why Choose Us?" />);

    const heading = screen.getByRole('heading', { level: 2, name: 'Why Choose Us?' });
    expect(heading.className).toContain('text-brand-text');
  });

  it('renders an optional subtitle in muted color', () => {
    render(
      <SectionHeading title="Pick a pack" subtitle="Choose the perfect amount" />,
    );

    expect(screen.getByText('Choose the perfect amount').className).toContain(
      'text-brand-muted',
    );
  });

  it('aligns left when align="left" is passed', () => {
    const { container } = render(
      <SectionHeading title="Item Shop" align="left" />,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('text-left');
  });
});
