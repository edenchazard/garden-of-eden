import { DateTime } from 'luxon';

export function predictedStartTimeFromHoursLeft(scroll: ScrollView) {
  // 168 + 1 to account for hidden minutes within hoursleft
  const elapsedHours = 168 + 1 - scroll.hoursleft;

  const now = DateTime.local()
    .setZone('America/New_York')
    .startOf('hour')
    .set({ second: 0, millisecond: 0 });
  return now.minus({ hours: elapsedHours });
}

export function isIncubated(scroll: ScrollView) {
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
  const predictedStartTime = predictedStartTimeFromHoursLeft(scroll);
  const hatchDate = DateTime.fromFormat(scroll.hatch, 'yyyy/MM/dd', {
    zone: 'America/New_York',
  });

  const hatchDifference = predictedStartTime
    .startOf('day')
    .diff(hatchDate.startOf('day'), 'day').days;

  return hatchDifference > 0;
}
