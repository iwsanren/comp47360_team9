import maxBy from 'lodash/maxBy';

export type Path = {
  legs: {
    distance: {
      value: number; // in meters
      text: string;
    };
  }[];
}[];

export const getMaxDistanceText = (paths: Path): string | undefined => {
  if (!paths || paths.length === 0) return undefined;

  const maxPath =
    paths.length > 1
      ? maxBy(paths, p => p.legs?.[0]?.distance?.value ?? 0)
      : paths[0];

  return maxPath?.legs?.[0]?.distance?.text;
};
