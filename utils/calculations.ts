import { DateTime } from 'luxon';

export function predictedStartTimeFromHoursLeft(scroll: ScrollView) {
  const elapsedHours = 168 - scroll.hoursleft;

  const now = DateTime.local()
    .setZone('America/New_York')
    .startOf('hour')
    .set({ second: 0, millisecond: 0 });

  console.log(elapsedHours);

  return now.minus({ hours: elapsedHours });
}
