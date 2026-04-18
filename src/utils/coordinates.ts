import { type Coordinates } from "../types/investigation";

type CoordinateLike = Coordinates | string | null | undefined;

export function parseCoordinateString(value: string): Coordinates | null {
  const [latText, lngText] = value.split(",").map((part) => part.trim());
  const lat = Number(latText);
  const lng = Number(lngText);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return { lat, lng };
}

export function normalizeCoordinates(value: CoordinateLike): Coordinates | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return parseCoordinateString(value);
  }

  if (Number.isNaN(value.lat) || Number.isNaN(value.lng)) {
    return null;
  }

  return value;
}

export function hasValidCoordinates(value: CoordinateLike): value is Coordinates | string {
  return normalizeCoordinates(value) !== null;
}
