export function formatNumber(num: number) {
  return Intl.NumberFormat().format(num);
}

export function formatHoursLeft(hours: number) {
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

const simpleCache: Record<
  string,
  {
    data: unknown;
    lastUpdate: number;
  }
> = {};

export async function cache<T = unknown>(
  key: string,
  expiry: number,
  callback: () => Promise<unknown>
) {
  if (key in simpleCache === false) {
    simpleCache[key] = {
      data: {},
      lastUpdate: -1,
    };
  }

  if (new Date().getTime() - simpleCache[key].lastUpdate >= expiry) {
    simpleCache[key].lastUpdate = new Date().getTime();
    simpleCache[key].data = await callback();
  }

  return simpleCache[key].data as T;
}
