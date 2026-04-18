const DATE_TIME_PATTERN =
  /^(?<day>\d{2})-(?<month>\d{2})-(?<year>\d{4})\s+(?<hour>\d{2}):(?<minute>\d{2})$/;

export function parseTurkishDateTime(value: string): Date | null {
  const trimmed = value.trim();
  const match = trimmed.match(DATE_TIME_PATTERN);

  if (!match?.groups) {
    return null;
  }

  const day = Number(match.groups.day);
  const month = Number(match.groups.month);
  const year = Number(match.groups.year);
  const hour = Number(match.groups.hour);
  const minute = Number(match.groups.minute);

  if (
    Number.isNaN(day) ||
    Number.isNaN(month) ||
    Number.isNaN(year) ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, hour, minute);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hour ||
    parsed.getMinutes() !== minute
  ) {
    return null;
  }

  return parsed;
}

export function formatTime(value: string): string {
  const parsed = parseTurkishDateTime(value);

  if (!parsed) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function formatDateTime(value: string): string {
  const parsed = parseTurkishDateTime(value);

  if (!parsed) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function toTimestampMs(value: string): number {
  return parseTurkishDateTime(value)?.getTime() ?? 0;
}
