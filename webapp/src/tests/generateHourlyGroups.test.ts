import { DateTime } from 'luxon';

import generateHourlyGroups from '../utils/generateHourlyGroups';

describe('generateHourlyGroups', () => {
  test('should return an object with 2 days and 47 hourly labels', () => {
    const zone = 'America/New_York';
    const now = DateTime.now().setZone(zone);
    const nextHour = now.plus({ hours: 1 }).startOf('hour');

    const result = generateHourlyGroups();

    // Check result is an object
    expect(typeof result).toBe('object');

    // Flatten all hour strings into one array
    const allHours = Object.values(result).flat();

    // Should have exactly 47 hourly labels
    expect(allHours.length).toBe(47);

    // Keys should match MM/DD format
    for (const key of Object.keys(result)) {
      expect(key).toMatch(/^\d{1,2}\/\d{1,2}$/);
    }

    // Values should match HH:00 format
    allHours.forEach(hourStr => {
      expect(hourStr).toMatch(/^\d{2}:00$/);
    });

    // The first hour string should be next full hour from now
    const expectedFirstHour = nextHour.toFormat("HH:00");
    const expectedFirstDate = `${nextHour.month}/${nextHour.day}`;
    expect(result[expectedFirstDate]?.[0]).toBe(expectedFirstHour);
  });
});
