import { getMaxDistanceText, Path } from '../utils/getMaxDistanceText';

describe('getMaxDistanceText', () => {
  it('should return the distance text of the path with the maximum distance (in miles)', () => {
    const paths: Path = [
      { legs: [{ distance: { value: 500, text: '0.31 mi' } }] },
      { legs: [{ distance: { value: 1200, text: '0.75 mi' } }] },
      { legs: [{ distance: { value: 800, text: '0.5 mi' } }] },
    ];
    const result = getMaxDistanceText(paths);
    expect(result).toBe('0.75 mi');
  });

  it('should return the distance text if only one path is provided (in miles)', () => {
    const paths: Path = [
      { legs: [{ distance: { value: 900, text: '0.56 mi' } }] },
    ];
    const result = getMaxDistanceText(paths);
    expect(result).toBe('0.56 mi');
  });

  it('should return undefined if input is empty', () => {
    const paths: Path = [];
    const result = getMaxDistanceText(paths);
    expect(result).toBeUndefined();
  });

  it('should return undefined if input is null', () => {
    const result = getMaxDistanceText(null as unknown as Path);
    expect(result).toBeUndefined();
  });

  it('should handle missing distance values gracefully', () => {
    const paths = [
      { legs: [{ distance: { value: 0, text: '0 mi' } }] },
      { legs: [{ distance: { value: undefined as unknown as number, text: '' } }] },
    ] as unknown as Path;

    const result = getMaxDistanceText(paths);
    expect(result).toBe('0 mi');
  });
});
