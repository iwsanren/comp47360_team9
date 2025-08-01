import calculateTreesNeededPerDay from '../utils/calculateTreesNeededPerDay';

describe('calculateTreesNeededPerDay', () => {
  it('should return 1 tree for 0.1 kg of CO₂', () => {
    expect(calculateTreesNeededPerDay(0.1)).toBe(1);
  });

  it('should return 17 trees for 2.7 kg of CO₂', () => {
    expect(calculateTreesNeededPerDay(2.7)).toBe(17);
  });

  it('should return 0 if CO₂ is 0', () => {
    expect(calculateTreesNeededPerDay(0)).toBe(0);
  });

  it('should round up to the nearest whole number', () => {
    const result = calculateTreesNeededPerDay(0.49); // ~2.98 trees, should round to 3
    expect(result).toBe(3);
  });

  it('should handle string input by coercing to number', () => {
    expect(calculateTreesNeededPerDay('1.2')).toBe(8); // 1.2 / (60/365) ≈ 7.3 → 8
  });

  it('should handle invalid input gracefully (e.g., NaN)', () => {
    expect(calculateTreesNeededPerDay(NaN)).toBeNaN();
  });
});
