import {
  type InvestigationRecord,
  type PersonProfile,
  type SuspicionLevel,
} from "../types/investigation.js";
import { toPersonId } from "./aliases.js";

const HIGH_SIGNAL_PATTERNS = [
  "uzaklaş",
  "kimse bilmesin",
  "son durak",
  "son nokta",
  "hallettim",
  "beni soran olursa",
];

const MEDIUM_SIGNAL_PATTERNS = ["asıl sürpriz", "gizemli", "hamamönü", "planladığım gibi"];
const SELF_INCRIMINATING_NOTE_PATTERNS = ["planladığım", "hallettim", "göstereceğim", "beni soran olursa"];

const isNearDisappearance = (record: InvestigationRecord, lastConfirmedSighting?: InvestigationRecord) => {
  if (!lastConfirmedSighting || record.timestampMs === 0) {
    return false;
  }

  const difference = lastConfirmedSighting.timestampMs - record.timestampMs;
  return difference >= 0 && difference <= 30 * 60 * 1000;
};

const matchesPattern = (text: string, patterns: string[]) =>
  patterns.some((pattern) => text.includes(pattern));

export const scorePerson = (
  personId: string,
  records: InvestigationRecord[],
  lastConfirmedSighting?: InvestigationRecord,
) => {
  if (personId === "podo") {
    return {
      suspicionScore: 0,
      suspicionLevel: "low" as SuspicionLevel,
    };
  }

  let score = 0;

  for (const record of records) {
    const text = `${record.title} ${record.description}`.toLocaleLowerCase("tr");
    const highSignal = matchesPattern(text, HIGH_SIGNAL_PATTERNS);
    const mediumSignal = !highSignal && matchesPattern(text, MEDIUM_SIGNAL_PATTERNS);
    const selfIncriminatingNote = matchesPattern(text, SELF_INCRIMINATING_NOTE_PATTERNS);
    const primaryId = record.primaryPerson ? toPersonId(record.primaryPerson) : undefined;
    const secondaryId = record.secondaryPerson ? toPersonId(record.secondaryPerson) : undefined;
    const directlyWithPodo = record.people.includes("Podo") && (primaryId === personId || secondaryId === personId);

    if (lastConfirmedSighting && record.id === lastConfirmedSighting.id && directlyWithPodo) {
      score += 45;
    }

    if (record.type === "message" && primaryId === personId && highSignal) {
      score += record.urgency === "high" ? 10 : 8;
    } else if (record.type === "message" && primaryId === personId && mediumSignal) {
      score += record.urgency === "high" ? 6 : 4;
    }

    if (record.type === "tip") {
      if (record.confidence === "high") {
        score += 18;
      } else if (record.confidence === "medium") {
        score += 10;
      } else if (record.confidence === "low") {
        score += 4;
      }
    }

    if (record.type === "note" && primaryId === personId && selfIncriminatingNote && highSignal) {
      score += 14;
    } else if (record.type === "note" && primaryId === personId && selfIncriminatingNote && mediumSignal) {
      score += 8;
    }

    if (record.type === "note" && primaryId !== personId && highSignal) {
      score += 18;
    } else if (record.type === "note" && primaryId !== personId && mediumSignal) {
      score += 10;
    }

    if (directlyWithPodo && isNearDisappearance(record, lastConfirmedSighting)) {
      score += 6;
    }

    if (record.type === "sighting" && directlyWithPodo) {
      score += 5;
    }
  }

  const suspicionScore = Math.min(score, 100);

  return {
    suspicionScore,
    suspicionLevel: toSuspicionLevel(suspicionScore),
  };
};

export const enrichProfilesWithScores = (
  profiles: Omit<PersonProfile, "suspicionLevel" | "suspicionScore">[],
  recordsByPerson: Map<string, InvestigationRecord[]>,
  lastConfirmedSighting?: InvestigationRecord,
) =>
  profiles.map((profile) => {
    const personRecords = recordsByPerson.get(profile.id) ?? [];
    const score = scorePerson(profile.id, personRecords, lastConfirmedSighting);

    return {
      ...profile,
      ...score,
    };
  });

const toSuspicionLevel = (score: number): SuspicionLevel => {
  if (score >= 75) {
    return "key";
  }

  if (score >= 45) {
    return "high";
  }

  if (score >= 20) {
    return "medium";
  }

  return "low";
};
