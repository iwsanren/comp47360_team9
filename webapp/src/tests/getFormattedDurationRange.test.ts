
import getFormattedDurationRange, { Path } from '../utils/getFormattedDurationRange';

describe('getFormattedDurationRange', () => {
  it('should return a single formatted time if only one path is provided', () => {
    const paths = [
      {
        legs: [
          {
            duration: { value: 3600 } // 60 min
          }
        ]
      }
    ];
    const result = getFormattedDurationRange(paths);
    expect(result).toBe('1h');
  });

  it('should return a range if multiple paths are provided', () => {
    const paths = [
      { legs: [{ duration: { value: 1800 } }] }, // 30 min
      { legs: [{ duration: { value: 4500 } }] }  // 75 min
    ];
    const result = getFormattedDurationRange(paths);
    expect(result).toBe('30 min - 1h 15 min');
  });

  it('should return formatted hour-minute range if hours differ', () => {
    const paths = [
      { legs: [{ duration: { value: 5400 } }] }, // 90 min = 1h30
      { legs: [{ duration: { value: 9600 } }] }  // 160 min = 2h40
    ];
    const result = getFormattedDurationRange(paths);
    expect(result).toBe('1h 30 min - 2h 40 min');
  });

  it('should return N/A for empty input', () => {
    const result = getFormattedDurationRange([]);
    expect(result).toBe('N/A');
  });

  it('should return N/A for all null durations', () => {
    const paths = [
      { legs: [{ duration: { value: null } }] },
      { legs: [{ duration: { value: undefined } }] }
    ] as unknown as Path;
    const result = getFormattedDurationRange(paths);
    expect(result).toBe('N/A');
  });
});
