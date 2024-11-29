import { DateTime } from 'luxon';
import type { DragonData } from '~/types/DragonTypes';
import { phase } from '~/utils/dragons';

export function predictedStartTimeFromHoursLeft(
  scroll: DragonData,
  offset: number = 0
) {
  const elapsedHours = 168 + offset - scroll.hoursleft;

  const now = DateTime.local()
    .setZone('America/New_York')
    .startOf('hour')
    .set({ second: 0, millisecond: 0 });
  return now.minus({ hours: elapsedHours });
}

export function isIncubated(scroll: DragonData) {
  if (phase(scroll) !== 'Egg') {
    return false;
  }

  // -1 offset to account for minutes within hoursleft on start time
  const predictedStartTime = predictedStartTimeFromHoursLeft(scroll, -1);
  const startDate = DateTime.fromFormat(scroll.start, 'yyyy/MM/dd', {
    zone: 'America/New_York',
  });

  const startDifference = predictedStartTime
    .startOf('day')
    .diff(startDate.startOf('day'), 'day').days;

  return startDifference < 0;
}

export function isStunned(scroll: DragonData) {
  if (phase(scroll) !== 'Hatchling') {
    return false;
  }

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
