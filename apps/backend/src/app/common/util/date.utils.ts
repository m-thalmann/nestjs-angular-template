export function convertDateToUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function getDateAfterMinutes(minutes: number): Date {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
}
