import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen } from '@testing-library/react';

import ActivityGraph from '../../src/components/ActivityGraph';
import { renderWithProviders } from '../test-utils';

describe('ActivityGraph', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-30T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the total reviews count', () => {
    const data = [
      { date: '2026-03-29', count: 5 },
      { date: '2026-03-28', count: 3 },
    ];

    renderWithProviders(<ActivityGraph data={data} />);

    // Total = 8, text: "8 reviews in the last year"
    expect(screen.getByText(/8 reviews in the last year/)).toBeInTheDocument();
  });

  it('renders the legend labels (Less / More)', () => {
    renderWithProviders(<ActivityGraph data={[]} />);

    expect(screen.getByText('Less')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('renders month labels', () => {
    const { container } = renderWithProviders(<ActivityGraph data={[]} />);

    // Month labels are rendered as span elements
    const monthSpans = container.querySelectorAll('span.font-display.text-\\[0\\.6875rem\\]');
    expect(monthSpans.length).toBeGreaterThanOrEqual(10);
  });

  it('renders day labels (Mon, Wed, Fri)', () => {
    renderWithProviders(<ActivityGraph data={[]} />);

    // Day labels from locale: ["", "Mon", "", "Wed", "", "Fri", ""]
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
  });

  it('renders with 0 total when no data', () => {
    renderWithProviders(<ActivityGraph data={[]} />);

    expect(screen.getByText('0 reviews in the last year')).toBeInTheDocument();
  });

  it('shows title with review counts in cells', () => {
    const data = [{ date: '2026-03-30', count: 10 }];

    const { container } = renderWithProviders(<ActivityGraph data={data} />);

    // Find a cell with a title containing the count
    const cell = container.querySelector('[title*="2026-03-30: 10"]');
    expect(cell).toBeInTheDocument();
  });
});
