import { formatAge } from '@umer/shared';
import { useCountUp } from '../hooks/useCountUp.js';

function Part({ value, singular, plural }) {
  const shown = useCountUp(value);
  return (
    <span aria-hidden="true" className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="figure text-ink">{shown}</span>
      <span className="text-[0.9375rem] font-medium text-ink-2">{value === 1 ? singular : plural}</span>
    </span>
  );
}

/**
 * "50 years 10 months 12 days", set as one line of type. The numerals scale
 * with the width of their container so the line fits on small phones.
 */
export function AgeFigure({ age }) {
  return (
    <div className="[container-type:inline-size]">
      <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 [&_.figure]:text-[clamp(1.875rem,calc(21cqi-2.25rem),3.25rem)]">
        <span className="sr-only">{formatAge(age)}</span>
        <Part value={age.years} singular="year" plural="years" />
        <Part value={age.months} singular="month" plural="months" />
        <Part value={age.days} singular="day" plural="days" />
      </p>
    </div>
  );
}
