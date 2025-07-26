// Converts durations to human readable format.
const formatMinutesToHourMin = (minMins: number, maxMins: number): string => {
  const toHM = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return { h, m };
  };

  const format = ({ h, m }: { h: number; m: number }) => {
    if (h && m) return `${h}h ${m}min`;
    if (h) return `${h}h`;
    return `${m}min`;
  };

  if (minMins === maxMins) {
    return format(toHM(minMins));
  }

  const min = toHM(minMins);
  const max = toHM(maxMins);

  if (min.h === max.h) {
    const hourPart = min.h > 0 ? `${min.h}h ` : '';
    return `${hourPart}${min.m} - ${max.m}min`;
  }

  return `${format(min)} - ${format(max)}`;
};

export default formatMinutesToHourMin;