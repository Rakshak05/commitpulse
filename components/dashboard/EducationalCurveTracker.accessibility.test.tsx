import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import EducationalCurveTracker from './EducationalCurveTracker';

expect.extend(toHaveNoViolations);

// Safely mock global fetch without using 'any'
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('EducationalCurveTracker Accessibility', () => {
  it('should have no accessibility violations in the loaded state', async () => {
    const mockPayload = {
      success: true,
      data: {
        totalStudyDays: 5,
        primaryDomain: 'Computer Architecture & Systems',
        timeline: [
          { date: '2026-04-10', totalDailyCommits: 2, domains: {} },
          { date: '2026-04-11', totalDailyCommits: 4, domains: {} },
        ],
      },
    };

    mockFetch.mockResolvedValueOnce({
      json: async () => mockPayload,
    });

    const { container } = render(<EducationalCurveTracker username="jalisa2106" />);

    // Wait for component to mount data
    await waitFor(() => {
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
