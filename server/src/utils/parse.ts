import { type Coordinates, type RawJotformAnswer } from "../types/investigation.js";

const MONTHS = new Map<string, number>([
  ["jan", 0],
  ["feb", 1],
  ["mar", 2],
  ["apr", 3],
  ["may", 4],
  ["jun", 5],
  ["jul", 6],
  ["aug", 7],
  ["sep", 8],
  ["oct", 9],
  ["nov", 10],
  ["dec", 11],
]);

export const answersByName = (answers: Record<string, RawJotformAnswer> = {}) =>
  Object.values(answers).reduce<Record<string, string>>((accumulator, answer) => {
    if (answer.name && typeof answer.answer === "string") {
      accumulator[answer.name] = answer.answer.trim();
    }

    return accumulator;
  }, {});

export const parseTimestamp = (value?: string, fallback?: string) => {
  const source = value?.trim() || fallback?.trim() || "";

  if (!source) {
    return {
      timestamp: "",
      timestampMs: 0,
    };
  }

  const ddMmYyyyMatch = source.match(
    /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (ddMmYyyyMatch) {
    const [, day, month, year, hour, minute, second = "0"] = ddMmYyyyMatch;
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );

    return {
      timestamp: source,
      timestampMs: parsed.getTime(),
    };
  }

  const isoLikeMatch = source.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (isoLikeMatch) {
    const [, year, month, day, hour, minute, second = "0"] = isoLikeMatch;
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );

    return {
      timestamp: source,
      timestampMs: parsed.getTime(),
    };
  }

  const nativeParsed = new Date(source);

  if (!Number.isNaN(nativeParsed.getTime())) {
    return {
      timestamp: source,
      timestampMs: nativeParsed.getTime(),
    };
  }

  return {
    timestamp: source,
    timestampMs: 0,
  };
};

export const parseCoordinates = (value?: string): Coordinates | null => {
  if (!value) {
    return null;
  }

  const [latPart, lngPart] = value.split(",").map((piece) => piece.trim());
  const lat = Number(latPart);
  const lng = Number(lngPart);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return { lat, lng };
};

export const splitPeople = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const parseSubmissionDateLabel = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const match = value.trim().match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/);

  if (!match) {
    return value.trim();
  }

  const [, monthLabel, day, year] = match;
  const monthIndex = MONTHS.get(monthLabel.toLowerCase());

  if (monthIndex === undefined) {
    return value.trim();
  }

  return new Date(Number(year), monthIndex, Number(day)).toLocaleDateString("en-GB");
};
