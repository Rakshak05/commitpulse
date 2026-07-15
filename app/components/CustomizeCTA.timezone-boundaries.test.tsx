import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

import { CustomizeCTA } from './CustomizeCTA';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('CustomizeCTA timezone boundaries', () => {
  const originalTZ = process.env.TZ;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.TZ = originalTZ;
  });

  it('renders successfully in UTC', () => {
    process.env.TZ = 'UTC';

    render(<CustomizeCTA />);

    expect(screen.getByText('customize_cta.title')).toBeInTheDocument();
  });

  it('renders successfully in IST', () => {
    process.env.TZ = 'Asia/Kolkata';

    render(<CustomizeCTA />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/customize');
  });

  it('renders successfully in EST', () => {
    process.env.TZ = 'America/New_York';

    render(<CustomizeCTA />);

    expect(screen.getByText('customize_cta.btn')).toBeInTheDocument();
  });

  it('renders successfully in JST', () => {
    process.env.TZ = 'Asia/Tokyo';

    render(<CustomizeCTA />);

    expect(screen.getByText('customize_cta.desc')).toBeInTheDocument();
  });

  it('renders consistently regardless of timezone changes', () => {
    process.env.TZ = 'UTC';

    const { rerender } = render(<CustomizeCTA />);

    process.env.TZ = 'Asia/Kolkata';

    rerender(<CustomizeCTA />);

    expect(screen.getByText('customize_cta.title')).toBeInTheDocument();
  });
});
