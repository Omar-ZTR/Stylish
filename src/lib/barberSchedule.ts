export const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const;

export const ALL_WEEKDAYS: number[] = WEEKDAYS.map(({ value }) => value);

export function isOpenOnDate(operatingDays: number[] | undefined, date: string) {
  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return Number.isInteger(weekday) && (operatingDays ?? ALL_WEEKDAYS).includes(weekday);
}
