const formatMinutesToDecimalHour = (minMins: number, maxMins: number): string => {
  const format = (mins: number) => (mins / 60).toFixed(1).replace(/\.0$/, '');

  if (minMins < 60 && maxMins < 60) {
    // if less than hr, display in mins 
    if (minMins === maxMins) return `${minMins} mins`;
    return `${minMins} - ${maxMins} mins`;
  }

  const minH = format(minMins);
  const maxH = format(maxMins);

  return minH === maxH ? `${minH}h` : `${minH} - ${maxH}h`;
}

export default formatMinutesToDecimalHour