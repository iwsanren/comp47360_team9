export type Path = {
  legs: {
    duration: { value: number }; // in seconds
  }[];
}[];

// Converts durations to human readable format.
const formatMinutesToDecimalHour = (
  minMins: number,
  maxMins?: number
): string => {
  const toHM = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return { h, m };
  };

  const format = ({ h, m }: { h: number; m: number }) => {
    if (h && m) return `${h}h ${m} min`;
    if (h) return `${h}h`;
    return `${m} min`;
  };

  if (minMins === maxMins || !maxMins) {
    return format(toHM(minMins));
  }

  const min = toHM(minMins);
  const max = toHM(maxMins);

  if (min.h === max.h) {
    const hourPart = min.h > 0 ? `${min.h}h ` : '';
    return `${hourPart}${min.m} - ${max.m} min`;
  }

  return `${format(min)} - ${format(max)}`;
};

const getFormattedDurationRange = (paths: Path): string => {
  if (!paths || paths.length === 0) return 'N/A';

  const durations = paths
    .map(p => p.legs?.[0]?.duration?.value ?? 0)
    .filter(Boolean);
  if (durations.length === 0) return 'N/A';

  const durationsInMinutes = durations.map(d => d / 60);
  const min = Math.min(...durationsInMinutes);
  const max =
    durationsInMinutes.length > 1 ? Math.max(...durationsInMinutes) : undefined;

  return formatMinutesToDecimalHour(min, max);
};

export default getFormattedDurationRange;
