// Converts durations to human readable format.
const formatMinutesToHourMin = (minMins: number, maxMins: number): string => {
  const format = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  };

  if (minMins === maxMins) {
    return format(minMins);
  }

  return `${format(minMins)} - ${format(maxMins)}`;
};

export default formatMinutesToHourMin;