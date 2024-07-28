export function formatNumber(num: number) {
  return Intl.NumberFormat().format(num);
}

export function formatHoursLeft(hours: number) {
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}
