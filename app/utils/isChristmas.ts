import { DateTime, Interval } from 'luxon';

export default function () {
  return Interval.fromDateTimes(
    DateTime.fromISO(`${DateTime.now().year}-12-01T00:00:00Z`),
    DateTime.fromISO(`${DateTime.now().year}-12-31T23:59:59Z`)
  ).contains(DateTime.utc());
}
