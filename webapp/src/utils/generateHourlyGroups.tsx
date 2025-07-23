import { DateTime } from "luxon";

const generateHourlyGroups = () => {
  const zone = "America/New_York";
  const now = DateTime.now().setZone(zone);
  const nextHour = now.plus({ hours: 1 }).startOf("hour");

  const result: Record<string, string[]> = {};

  for (let i = 0; i < 47; i++) {
    const hour = nextHour.plus({ hours: i });
    const dateKey = `${hour.month}/${hour.day}`;
    const hourStr = hour.toFormat("HH:00");

    if (!result[dateKey]) {
      result[dateKey] = [];
    }

    result[dateKey].push(hourStr);
  }

  return Object.entries(result);
}

export default generateHourlyGroups
