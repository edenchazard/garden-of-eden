import { DateTime } from 'luxon';

export function predictedStartTimeFromHoursLeft(
  scroll: ScrollView,
  offset: number = 0
) {
  const elapsedHours = 168 + offset - scroll.hoursleft;

  const now = DateTime.local()
    .setZone('America/New_York')
    .startOf('hour')
    .set({ second: 0, millisecond: 0 });
  return now.minus({ hours: elapsedHours });
}

export function isIncubated(scroll: ScrollView) {
  // no offset as eggs are weird
  const predictedStartTime = predictedStartTimeFromHoursLeft(scroll);
  const startDate = DateTime.fromFormat(scroll.start, 'yyyy/MM/dd', {
    zone: 'America/New_York',
  });

  const startDifference = predictedStartTime
    .startOf('day')
    .diff(startDate.startOf('day'), 'day').days;

  return startDifference < 0;
}

export function isStunned(scroll: ScrollView) {
  // +1 offset to account for minutes within hoursleft on hatch time
  const predictedStartTime = predictedStartTimeFromHoursLeft(scroll, 1);
  const hatchDate = DateTime.fromFormat(scroll.hatch, 'yyyy/MM/dd', {
    zone: 'America/New_York',
  });

  const hatchDifference = predictedStartTime
    .startOf('day')
    .diff(hatchDate.startOf('day'), 'day').days;

  return hatchDifference > 0;
}
