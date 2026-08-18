import type { Branded } from './brand';

/**
 * Body weight, stored as whole grams.
 *
 * Grams are the canonical unit throughout the data layer. Conversion happens
 * only at the display edge, so switching the display unit never migrates,
 * rewrites, or re-rounds anything on disk.
 */
export type Grams = Branded<number, 'Grams'>;

/** Height, stored as whole centimetres. */
export type Centimetres = Branded<number, 'Centimetres'>;

export type WeightUnit = 'kg' | 'lb';
export type HeightUnit = 'cm' | 'ftin';

const GRAMS_PER_KILOGRAM = 1000;
const GRAMS_PER_POUND = 453.59237;
const CENTIMETRES_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

export function grams(value: number): Grams {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`Not a weight: ${value}`);
  return Math.round(value) as Grams;
}

export function centimetres(value: number): Centimetres {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`Not a height: ${value}`);
  return Math.round(value) as Centimetres;
}

/** Parse a weight the user typed in `unit` into canonical grams. */
export function weightToGrams(value: number, unit: WeightUnit): Grams {
  return grams(value * (unit === 'kg' ? GRAMS_PER_KILOGRAM : GRAMS_PER_POUND));
}

/** Convert stored grams into `unit`, rounded to one decimal place for display. */
export function gramsToWeight(value: Grams, unit: WeightUnit): number {
  const converted = value / (unit === 'kg' ? GRAMS_PER_KILOGRAM : GRAMS_PER_POUND);
  return Math.round(converted * 10) / 10;
}

export function formatWeight(value: Grams, unit: WeightUnit): string {
  return `${gramsToWeight(value, unit).toFixed(1)} ${unit}`;
}

export function heightToCentimetres(feet: number, inches: number): Centimetres {
  return centimetres((feet * INCHES_PER_FOOT + inches) * CENTIMETRES_PER_INCH);
}

export function centimetresToFeetInches(value: Centimetres): { feet: number; inches: number } {
  const totalInches = Math.round(value / CENTIMETRES_PER_INCH);
  return {
    feet: Math.floor(totalInches / INCHES_PER_FOOT),
    inches: totalInches % INCHES_PER_FOOT,
  };
}

export function formatHeight(value: Centimetres, unit: HeightUnit): string {
  if (unit === 'cm') return `${value} cm`;
  const { feet, inches } = centimetresToFeetInches(value);
  return `${feet}′ ${inches}″`;
}
