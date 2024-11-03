import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';

describe('formatRatio', () => {
  it('should format ratio', () => {
    expect(formatRatio(1, 2)).to.be.eql('0.5:1');
    expect(formatRatio(0, 0)).to.be.eql('0:0');
    expect(formatRatio(0, 1)).to.be.eql('0:1');
    expect(formatRatio(1, 0)).to.be.eql('∞:0');
  });
});

const getRandomDateInLastThreeDays = (): DateTime => {
  const now = DateTime.local().setZone('America/New_York').startOf('day');

  const randomDaysAgo = Math.floor(Math.random() * 3) + 1;

  const randomDate = now.minus({ days: randomDaysAgo });

  return randomDate;
};

const getHoursFromDate = (date: DateTime, targetTime: string): number => {
  const [targetHour, targetMinute] = targetTime.split(':').map(Number);
  const targetDateTime = date
    .set({ hour: targetHour, minute: targetMinute, second: 0, millisecond: 0 })
    .setZone('America/New_York');

  const currentDateTime = DateTime.local()
    .setZone('America/New_York')
    .startOf('hour');

  return Math.abs(currentDateTime.diff(targetDateTime, 'hours').hours);
};

describe('getRandomDateInLastThreeDays', () => {
  it('should return a date that is 1, 2, or 3 days ago from today', () => {
    const randomDate = getRandomDateInLastThreeDays();
    const now = DateTime.local().setZone('America/New_York').startOf('day');

    const oneDayAgo = now.minus({ days: 1 }).toISODate();
    const twoDaysAgo = now.minus({ days: 2 }).toISODate();
    const threeDaysAgo = now.minus({ days: 3 }).toISODate();

    const expectedDates = [oneDayAgo, twoDaysAgo, threeDaysAgo];

    const randomDateISO = randomDate.toISODate();

    expect(expectedDates).to.include(randomDateISO);
  });

  it('should return a date at the start of the day', () => {
    const randomDate = getRandomDateInLastThreeDays();

    expect(randomDate.hour).to.be.eql(0);
    expect(randomDate.minute).to.be.eql(0);
    expect(randomDate.second).to.be.eql(0);
  });
});

describe.only('predictedStartTimeFromHoursLeft', () => {
  it('should correctly predict the start time of 23:00', () => {
    const date = getRandomDateInLastThreeDays();

    const scroll = {
      acceptaid: false,
      clicks: 19,
      death: '0',
      gender: '' as const,
      grow: '0',
      hatch: date.toFormat('yyyy/MM/dd'),
      hoursleft: 168 - getHoursFromDate(date, '23:00'),
      id: '1MpI7',
      in_garden: true,
      in_seed_tray: false,
      name: null,
      owner: null,
      parent_f: 'qtPfX',
      parent_m: '6ZbCN',
      start: '2024/10/26',
      stunned: true,
      unique: 384,
      views: 3860,
    };

    console.log(scroll);

    const predictedDate = predictedStartTimeFromHoursLeft(scroll);
    console.log(predictedDate);
    expect(predictedDate).to.be.eql(
      date.set({ hour: 23, minute: 0, second: 0, millisecond: 0 })
    );
  });

  it('should correctly predict the start time of 00:00', () => {
    const date = getRandomDateInLastThreeDays();

    const scroll = {
      acceptaid: false,
      clicks: 19,
      death: '0',
      gender: '' as const,
      grow: '0',
      hatch: date.toFormat('yyyy/MM/dd'),
      hoursleft: 168 - getHoursFromDate(date, '00:00'),
      id: '1MpI7',
      in_garden: true,
      in_seed_tray: false,
      name: null,
      owner: null,
      parent_f: 'qtPfX',
      parent_m: '6ZbCN',
      start: '2024/10/26',
      stunned: true,
      unique: 384,
      views: 3860,
    };

    console.log(scroll);

    const predictedDate = predictedStartTimeFromHoursLeft(scroll);
    console.log(predictedDate);
    expect(predictedDate).to.be.eql(
      date.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    );
  });

  it('should correctly predict the start time of 01:00', () => {
    const date = getRandomDateInLastThreeDays();

    const scroll = {
      acceptaid: false,
      clicks: 19,
      death: '0',
      gender: '' as const,
      grow: '0',
      hatch: date.toFormat('yyyy/MM/dd'),
      hoursleft: 168 - getHoursFromDate(date, '01:00'),
      id: '1MpI7',
      in_garden: true,
      in_seed_tray: false,
      name: null,
      owner: null,
      parent_f: 'qtPfX',
      parent_m: '6ZbCN',
      start: '2024/10/26',
      stunned: true,
      unique: 384,
      views: 3860,
    };

    console.log(scroll);

    const predictedDate = predictedStartTimeFromHoursLeft(scroll);
    console.log(predictedDate);
    expect(predictedDate).to.be.eql(
      date.set({ hour: 1, minute: 0, second: 0, millisecond: 0 })
    );
  });
});
