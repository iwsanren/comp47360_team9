import { DateTime } from "luxon";

const getNextHourInNY = () => {
  const nowNY = DateTime.now().setZone("America/New_York");
  const nextHour = nowNY.plus({ hours: 1 }).startOf("hour");

  const timestampMillis = nextHour.toSeconds();

  return timestampMillis
}

export default getNextHourInNY