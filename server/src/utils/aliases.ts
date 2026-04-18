const EXPLICIT_ALIASES = new Map<string, string>([
  ["kagan", "kagan"],
  ["kagan a", "kagan"],
  ["kağan", "kagan"],
  ["kağan a", "kagan"],
]);

const PREFERRED_DISPLAY_NAMES = new Map<string, string>([
  ["asli", "Aslı"],
  ["can", "Can"],
  ["cem", "Cem"],
  ["eray", "Eray"],
  ["fatih", "Fatih"],
  ["gulsah", "Gülşah"],
  ["hami", "Hami"],
  ["kagan", "Kağan"],
  ["podo", "Podo"],
]);

const NON_PERSON_IDS = new Set(["unknown", "event staff"]);

export const normalizeNameToken = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

export const toPersonId = (value: string) =>
  EXPLICIT_ALIASES.get(normalizeNameToken(value)) ?? normalizeNameToken(value);

export const isPersonLike = (value?: string) => {
  if (!value) {
    return false;
  }

  return !NON_PERSON_IDS.has(toPersonId(value));
};

export const buildAliasDirectory = (names: string[]) => {
  const aliasesById = new Map<string, Set<string>>();
  const displayNameById = new Map<string, string>();

  for (const name of names) {
    const trimmed = name.trim();

    if (!trimmed || !isPersonLike(trimmed)) {
      continue;
    }

    const id = toPersonId(trimmed);
    const aliases = aliasesById.get(id) ?? new Set<string>();
    aliases.add(trimmed);
    aliasesById.set(id, aliases);

    if (!displayNameById.has(id)) {
      displayNameById.set(id, PREFERRED_DISPLAY_NAMES.get(id) ?? trimmed);
    }
  }

  return {
    aliasesById,
    displayNameById,
  };
};

export const getDisplayName = (id: string, fallback?: string) =>
  PREFERRED_DISPLAY_NAMES.get(id) ?? fallback ?? id;
