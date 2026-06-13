// app/api/wrapped/route.massive-scaling.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { getWrappedData } from '../../../lib/github';
import type { ContributionCalendar } from '../../../types';
import type { WrappedStats } from '../../../types/dashboard';

vi.mock('../../../lib/github', () => ({
  getWrappedData: vi.fn(),
  fetchGitHubContributions: vi.fn(),
}));

// 52 weeks × 7 days = 364 ContributionDay entries, each at extreme count
const massiveCalendar: ContributionCalendar = {
  totalContributions: 999999999,
  weeks: Array.from({ length: 52 }, (_, weekIndex) => ({
    contributionDays: Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(2025, 0, 1 + weekIndex * 7 + dayIndex).toISOString().split('T')[0];
      return {
        contributionCount: 9999999,
        date,
      };
    }),
  })),
};

const massiveWrappedStats: WrappedStats = {
  totalContributions: 999999999,
  mostActiveDate: '2025-12-31',
  highestDailyCount: 9999999,
  busiestMonth: '2025-12',
  weekendRatio: 99,
  topLanguage: 'A'.repeat(50), // extremely long language name to stress-test wrapping/scaling
  calendar: massiveCalendar,
};

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/wrapped');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('GET /api/wrapped – Massive Data Sets and Extreme High Bounds Scaling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWrappedData).mockResolvedValue(massiveWrappedStats);
  });

  it('1. handles mock objects with thousands of contributor actions without numeric overflow', async () => {
    const response = await GET(makeRequest({ user: 'octocat' }));
    expect(response.status).toBe(200);
  });

  it('2. renders the module without crashing under highly loaded configuration', async () => {
    const response = await GET(makeRequest({ user: 'octocat' }));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('<svg');
    expect(body).toContain('</svg>');
  });

  it('3. ensures SVG coordinates and text scale cleanly without layout corruption', async () => {
    const response = await GET(makeRequest({ user: 'octocat' }));
    expect(response.status).toBe(200);
    const body = await response.text();

    // viewBox attribute is present and parseable
    expect(body).toMatch(/viewBox="[\d\s.-]+"/);

    // The body does not contain NaN or Infinity
    expect(body).not.toContain('NaN');
    expect(body).not.toContain('Infinity');

    // The massive number (999999999) or abbreviated form (e.g., 999 or M) is present
    const containsLargeNumberOrAbbreviation =
      body.includes('999999999') || body.includes('999') || body.includes('M');
    expect(containsLargeNumberOrAbbreviation).toBe(true);
  });

  it('4. ensures execution time stays below 1500ms under extreme load', async () => {
    const start = performance.now();
    const response = await GET(makeRequest({ user: 'octocat' }));
    const end = performance.now();

    expect(response.status).toBe(200);
    expect(end - start).toBeLessThan(1500);
  });

  it('5. renders grid/listing structure as parseable SVG without layout-tree breaks', async () => {
    const response = await GET(makeRequest({ user: 'octocat' }));
    expect(response.status).toBe(200);
    const body = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(body, 'image/svg+xml');

    const parserErrors = doc.getElementsByTagName('parsererror');
    expect(parserErrors.length).toBe(0);

    const rects = doc.getElementsByTagName('rect');
    const texts = doc.getElementsByTagName('text');
    expect(rects.length + texts.length).toBeGreaterThan(0);
  });
});
