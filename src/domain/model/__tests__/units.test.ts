import { describe, expect, it } from 'vitest';
import {
  centimetresToFeetInches,
  formatWeight,
  gramsToWeight,
  grams,
  heightToCentimetres,
  weightToGrams,
} from '../units';

describe('weight conversion', () => {
  it('stores kilograms as whole grams', () => {
    expect(weightToGrams(72.4, 'kg')).toBe(72_400);
  });

  it('stores pounds as whole grams', () => {
    expect(weightToGrams(160, 'lb')).toBe(72_575);
  });

  it('displays grams to one decimal place', () => {
    expect(gramsToWeight(grams(72_437), 'kg')).toBe(72.4);
    expect(gramsToWeight(grams(72_575), 'lb')).toBe(160);
  });

  it('formats with the unit', () => {
    expect(formatWeight(grams(72_000), 'kg')).toBe('72.0 kg');
  });

  it('survives a round trip through either unit without drifting', () => {
    for (const value of [50, 63.7, 72.4, 105.9]) {
      expect(gramsToWeight(weightToGrams(value, 'kg'), 'kg')).toBe(value);
    }
    for (const value of [110, 154.3, 200.8]) {
      expect(gramsToWeight(weightToGrams(value, 'lb'), 'lb')).toBe(value);
    }
  });

  it('does not re-round when the display unit is switched back and forth', () => {
    const stored = weightToGrams(72.4, 'kg');
    const viaPounds = gramsToWeight(stored, 'lb');
    expect(viaPounds).toBeCloseTo(159.6, 1);
    // The stored value is untouched by looking at it in another unit.
    expect(gramsToWeight(stored, 'kg')).toBe(72.4);
  });

  it('rejects impossible weights', () => {
    expect(() => grams(-1)).toThrow(RangeError);
    expect(() => grams(Number.NaN)).toThrow(RangeError);
  });
});

describe('height conversion', () => {
  it('stores feet and inches as whole centimetres', () => {
    expect(heightToCentimetres(5, 9)).toBe(175);
  });

  it('reads centimetres back as feet and inches', () => {
    expect(centimetresToFeetInches(175 as never)).toEqual({ feet: 5, inches: 9 });
  });
});
