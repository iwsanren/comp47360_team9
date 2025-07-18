import { DateTime } from "luxon";

function getNextHourInNY() {
  const nowNY = DateTime.now().setZone("America/New_York");
  const nextHour = nowNY.plus({ hours: 1 }).startOf("hour");

  const timestampMillis = nextHour.toSeconds();

  return timestampMillis
}

export default getNextHourInNY