import { formatDateShort } from '@/domain/model/date';
import { gramsToWeight, type WeightUnit } from '@/domain/model/units';
import type { WeightTrend } from '@/domain/usecases/weighing';
import styles from './weighing.module.css';

const WIDTH = 320;
const HEIGHT = 150;
const PADDING = { top: 12, right: 8, bottom: 22, left: 34 };

/**
 * Readings plotted over weeks. There are deliberately no week-on-week deltas
 * and no badges: the program reads this as a trend, never as a single number.
 */
export function WeightChart({ trend, unit }: { trend: WeightTrend; unit: WeightUnit }) {
  const { points } = trend;
  if (points.length === 0) return null;

  const values = points.map((point) => gramsToWeight(point.weightGrams, unit));
  const low = Math.min(...values);
  const high = Math.max(...values);
  // Keep a visible band even when every reading is identical.
  const span = Math.max(high - low, 2);
  const mid = (high + low) / 2;
  const minY = mid - span * 0.75;
  const maxY = mid + span * 0.75;

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const x = (index: number): number =>
    PADDING.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const y = (value: number): number =>
    PADDING.top + plotHeight - ((value - minY) / (maxY - minY)) * plotHeight;

  const line = values.map((value, index) => `${x(index)},${y(value)}`).join(' ');

  return (
    <svg
      className={styles.chart}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Weight over ${points.length} weekly readings`}
    >
      {[maxY, mid, minY].map((value) => (
        <g key={value}>
          <line
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={y(value)}
            y2={y(value)}
            className={styles.grid}
          />
          <text x={4} y={y(value) + 4} className={styles.axis}>
            {value.toFixed(0)}
          </text>
        </g>
      ))}

      {points.length > 1 ? <polyline points={line} className={styles.line} /> : null}

      {values.map((value, index) => (
        <circle key={points[index]?.date} cx={x(index)} cy={y(value)} r={4} className={styles.dot} />
      ))}

      {points.map((point, index) =>
        index === 0 || index === points.length - 1 ? (
          <text
            key={point.date}
            x={x(index)}
            y={HEIGHT - 6}
            textAnchor={index === 0 ? 'start' : 'end'}
            className={styles.axis}
          >
            {formatDateShort(point.date)}
          </text>
        ) : null,
      )}
    </svg>
  );
}
