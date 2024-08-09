export function formatNumber(num: number) {
  return Intl.NumberFormat().format(num);
}

export function formatHoursLeft(hours: number) {
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

export function formatRatio(a: number, b: number) {
  return (
    Intl.NumberFormat(undefined, {
      maximumFractionDigits: 1,
    }).format(a / b) + `:${1}`
  );
}

const simpleCache: Record<
  string,
  {
    data: unknown;
    lastUpdate: number | null;
    expiry: null | number;
  }
> = {};

export async function cache<T = unknown>(
  key: string,
  expiry: number | null = null,
  callback?: () => T
) {
  if (key in simpleCache === false) {
    simpleCache[key] = {
      data: {},
      lastUpdate: expiry === null ? null : -1,
      expiry: expiry,
    };
  }

  if (
    expiry &&
    callback &&
    simpleCache[key].lastUpdate &&
    new Date().getTime() - simpleCache[key].lastUpdate >= expiry
  ) {
    simpleCache[key].lastUpdate = new Date().getTime();
    simpleCache[key].data =
      callback instanceof Promise ? await callback() : callback();
  }

  return simpleCache[key].data as T;
}

export async function setCache<T = unknown>(key: string, data: T) {
  simpleCache[key] = {
    data,
    lastUpdate: null,
    expiry: null,
  };
}

export function filterSelectAll(settings: UserSettings) {
  return (dragon: ScrollView) => {
    if (
      dragon.hatch !== "0" &&
      168 - dragon.hoursleft >= settings.hatchlingMinAge
    ) {
      return true;
    } else if (
      dragon.hatch === "0" &&
      168 - dragon.hoursleft >= settings.eggMinAge
    ) {
      return true;
    }

    return false;
  };
}
