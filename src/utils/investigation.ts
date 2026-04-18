import {
  type ConversationEntry,
  type InvestigationFilters,
  type InvestigationApiResponse,
  type InvestigationRecord,
  type PersonProfile,
  type RouteStop,
  type SubjectChronologyEntry,
} from "../types/investigation";
import { normalizeCoordinates } from "./coordinates";
import { toTimestampMs } from "./date";

export function normalizePersonKey(value: string): string {
  return value
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
}

export function sortRecordsByTimestamp(records: InvestigationRecord[]): InvestigationRecord[] {
  return [...records].sort(
    (left, right) => toTimestampMs(left.timestamp) - toTimestampMs(right.timestamp),
  );
}

export function getFilteredRecords(
  records: InvestigationRecord[],
  filters: InvestigationFilters,
): InvestigationRecord[] {
  return sortRecordsByTimestamp(records).filter((record) => {
    if (
      filters.selectedPersonId &&
      !record.people.some((person) => normalizePersonKey(person) === filters.selectedPersonId)
    ) {
      return false;
    }

    if (filters.eventType !== "all" && record.type !== filters.eventType) {
      return false;
    }

    if (
      filters.onlyPodo &&
      !record.people.some((person) => normalizePersonKey(person) === "podo")
    ) {
      return false;
    }

    return true;
  });
}

export function buildPodoRoute(
  records: InvestigationRecord[],
  selectedPersonId: string | null,
): RouteStop[] {
  return sortRecordsByTimestamp(records)
    .filter((record) => record.people.some((person) => normalizePersonKey(person) === "podo"))
    .filter((record) => {
      if (!selectedPersonId || selectedPersonId === "podo") {
        return true;
      }

      return record.people.some((person) => normalizePersonKey(person) === selectedPersonId);
    })
    .map((record) => {
      const coordinates = normalizeCoordinates(record.coordinates);

      if (!coordinates) {
        return null;
      }

      return {
        recordId: record.id,
        lat: coordinates.lat,
        lng: coordinates.lng,
        timestamp: record.timestamp,
        title: record.title,
        sequence: 0,
      };
    })
    .filter((stop): stop is RouteStop => stop !== null)
    .map((stop, index) => ({
      ...stop,
      sequence: index + 1,
    }));
}

export function findDefaultSelectedRecordId(
  data: InvestigationApiResponse,
): string | null {
  const lastConfirmed = data.summary.lastConfirmedSighting;

  if (lastConfirmed) {
    const matchedRecord = sortRecordsByTimestamp(data.records).find(
      (record) =>
        record.timestamp === lastConfirmed.timestamp &&
        record.location === lastConfirmed.location &&
        lastConfirmed.people.every((person) => record.people.includes(person)),
    );

    if (matchedRecord) {
      return matchedRecord.id;
    }
  }

  return sortRecordsByTimestamp(data.records)[0]?.id ?? null;
}

export function findPersonById(
  people: PersonProfile[],
  selectedPersonId: string | null,
): PersonProfile | null {
  if (!selectedPersonId) {
    return null;
  }

  return people.find((person) => person.id === selectedPersonId) ?? null;
}

export function buildConversationEntries(
  records: InvestigationRecord[],
  people: PersonProfile[],
  focusPersonId: string,
  searchTerm: string,
): ConversationEntry[] {
  const searchKey = normalizePersonKey(searchTerm);
  const displayNameById = new Map(people.map((person) => [person.id, person.displayName]));
  const threadMap = new Map<string, InvestigationRecord[]>();

  for (const record of sortRecordsByTimestamp(records)) {
    if (record.type !== "message" || !record.primaryPerson || !record.secondaryPerson) {
      continue;
    }

    const primaryId = normalizePersonKey(record.primaryPerson);
    const secondaryId = normalizePersonKey(record.secondaryPerson);

    if (primaryId !== focusPersonId && secondaryId !== focusPersonId) {
      continue;
    }

    const counterpartId = primaryId === focusPersonId ? secondaryId : primaryId;
    const current = threadMap.get(counterpartId) ?? [];
    current.push(record);
    threadMap.set(counterpartId, current);
  }

  return [...threadMap.entries()]
    .map(([counterpartId, messages]) => {
      const lastMessage = messages[messages.length - 1];
      const counterpartName =
        displayNameById.get(counterpartId) ??
        messages.find((message) => normalizePersonKey(message.primaryPerson ?? "") === counterpartId)
          ?.primaryPerson ??
        messages.find((message) => normalizePersonKey(message.secondaryPerson ?? "") === counterpartId)
          ?.secondaryPerson ??
        counterpartId;

      return {
        id: `${focusPersonId}:${counterpartId}`,
        focusPersonId,
        focusPersonName: displayNameById.get(focusPersonId) ?? focusPersonId,
        counterpartId,
        counterpartName,
        messages,
        lastMessage,
      };
    })
    .filter((entry) => {
      if (!searchKey) {
        return true;
      }

      if (
        normalizePersonKey(entry.counterpartName).includes(searchKey) ||
        normalizePersonKey(entry.focusPersonName).includes(searchKey)
      ) {
        return true;
      }

      return entry.messages.some((message) => {
        const haystack = normalizePersonKey(
          [
            message.primaryPerson,
            message.secondaryPerson,
            message.description,
            message.title,
            message.location,
          ]
            .filter(Boolean)
            .join(" "),
        );

        return haystack.includes(searchKey);
      });
    })
    .sort(
      (left, right) =>
        toTimestampMs(right.lastMessage.timestamp) - toTimestampMs(left.lastMessage.timestamp),
    );
}

export function filterConversationMessages(
  conversation: ConversationEntry | null,
  searchTerm: string,
) {
  if (!conversation) {
    return [];
  }

  const searchKey = normalizePersonKey(searchTerm);

  if (!searchKey) {
    return conversation.messages;
  }

  return conversation.messages.filter((message) =>
    normalizePersonKey(
      [
        message.primaryPerson,
        message.secondaryPerson,
        message.description,
        message.title,
        message.location,
      ]
        .filter(Boolean)
        .join(" "),
    ).includes(searchKey),
  );
}

function scoreChronologyDelta(record: InvestigationRecord, subjectId: string) {
  const subjectNameInRecord = record.people.some((person) => normalizePersonKey(person) === subjectId);

  if (!subjectNameInRecord) {
    return {
      delta: 0,
      reason: "Not directly linked to the selected subject.",
    };
  }

  let delta = 1;
  const text = `${record.title} ${record.description}`.toLocaleLowerCase("tr");

  if (record.type === "tip") {
    delta += record.confidence === "high" ? 4 : record.confidence === "medium" ? 3 : 1;
  }

  if (record.type === "message") {
    delta += record.urgency === "high" ? 4 : record.urgency === "medium" ? 2 : 1;
  }

  if (record.type === "sighting") {
    delta += 2;
  }

  if (text.includes("son") || text.includes("gizemli") || text.includes("kimse bilmesin")) {
    delta += 3;
  }

  if (text.includes("hallettim") || text.includes("uzaklaş")) {
    delta += 4;
  }

  const reason =
    record.type === "tip"
      ? "Anonymous reporting added suspicion weight."
      : record.type === "message"
        ? "Direct communication affected the subject timeline."
        : record.type === "sighting"
          ? "Physical proximity increased relevance."
          : record.type === "note"
            ? "Witness notes affected interpretation."
            : "Check-in establishes presence in the timeline.";

  return { delta, reason };
}

export function buildSubjectChronology(
  records: InvestigationRecord[],
  selectedPerson: PersonProfile | null,
): SubjectChronologyEntry[] {
  const isTrackedPodo = selectedPerson?.id === "podo";
  const relevantRecords = selectedPerson
    ? sortRecordsByTimestamp(records).filter((record) =>
        record.people.some((person) => normalizePersonKey(person) === selectedPerson.id),
      )
    : sortRecordsByTimestamp(records).slice(0, 10);

  let cumulativeScore = 0;

  return relevantRecords.map((record) => {
    if (isTrackedPodo) {
      return {
        record,
        delta: 0,
        cumulativeScore: 0,
        reason: "Tracked route context for Podo's movement and last known path.",
        isScored: false,
      };
    }

    const { delta, reason } = scoreChronologyDelta(record, selectedPerson?.id ?? "");
    cumulativeScore += delta;

    return {
      record,
      delta,
      cumulativeScore,
      reason,
      isScored: true,
    };
  });
}
