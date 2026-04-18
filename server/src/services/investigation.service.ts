import { fetchAllFormSubmissions } from "./jotform.service.js";
import { buildAliasDirectory, getDisplayName, isPersonLike, toPersonId } from "../utils/aliases.js";
import { normalizeInvestigationRecords } from "../utils/normalize.js";
import { enrichProfilesWithScores } from "../utils/scoring.js";
import {
  type InvestigationApiResponse,
  type InvestigationRecord,
  type MessageThread,
  type PersonProfile,
} from "../types/investigation.js";

const normalizeRecordPeople = (
  records: InvestigationRecord[],
  displayNameById: Map<string, string>,
) =>
  records.map((record) => {
    const normalizedPeople = record.people
      .filter((person) => isPersonLike(person))
      .map((person) => displayNameById.get(toPersonId(person)) ?? getDisplayName(toPersonId(person), person));

    const primaryPerson = record.primaryPerson
      ? displayNameById.get(toPersonId(record.primaryPerson)) ??
        getDisplayName(toPersonId(record.primaryPerson), record.primaryPerson)
      : undefined;

    const secondaryPerson =
      record.secondaryPerson && isPersonLike(record.secondaryPerson)
        ? displayNameById.get(toPersonId(record.secondaryPerson)) ??
          getDisplayName(toPersonId(record.secondaryPerson), record.secondaryPerson)
        : undefined;

    return {
      ...record,
      people: [...new Set(normalizedPeople)],
      primaryPerson,
      secondaryPerson,
    };
  });

const buildRecordsByPerson = (records: InvestigationRecord[]) => {
  const recordsByPerson = new Map<string, InvestigationRecord[]>();

  for (const record of records) {
    for (const person of record.people) {
      const personId = toPersonId(person);
      const existing = recordsByPerson.get(personId) ?? [];
      existing.push(record);
      recordsByPerson.set(personId, existing);
    }
  }

  return recordsByPerson;
};

const buildPeople = (
  records: InvestigationRecord[],
  aliasesById: Map<string, Set<string>>,
  displayNameById: Map<string, string>,
): PersonProfile[] => {
  const recordsByPerson = buildRecordsByPerson(records);
  const baseProfiles = [...displayNameById.entries()].map(([id, displayName]) => ({
    id,
    displayName,
    aliases: [...(aliasesById.get(id) ?? new Set<string>())].sort((left, right) =>
      left.localeCompare(right, "tr"),
    ),
    recordCount: (recordsByPerson.get(id) ?? []).length,
  }));

  const lastConfirmedSighting = [...records]
    .filter((record) => record.type === "sighting" && record.people.includes("Podo"))
    .sort((left, right) => right.timestampMs - left.timestampMs)[0];

  return enrichProfilesWithScores(baseProfiles, recordsByPerson, lastConfirmedSighting).sort(
    (left, right) =>
      right.suspicionScore - left.suspicionScore ||
      right.recordCount - left.recordCount ||
      left.displayName.localeCompare(right.displayName, "tr"),
  );
};

const buildMessageThreads = (records: InvestigationRecord[]): Record<string, MessageThread[]> => {
  const threadStore = new Map<string, Map<string, InvestigationRecord[]>>();

  for (const record of records) {
    if (record.type !== "message" || !record.primaryPerson || !record.secondaryPerson) {
      continue;
    }

    const pairs: Array<[string, string]> = [
      [record.primaryPerson, record.secondaryPerson],
      [record.secondaryPerson, record.primaryPerson],
    ];

    for (const [person, counterpart] of pairs) {
      const byCounterpart = threadStore.get(toPersonId(person)) ?? new Map<string, InvestigationRecord[]>();
      const messages = byCounterpart.get(counterpart) ?? [];
      messages.push(record);
      byCounterpart.set(counterpart, messages);
      threadStore.set(toPersonId(person), byCounterpart);
    }
  }

  return Object.fromEntries(
    [...threadStore.entries()].map(([personId, byCounterpart]) => [
      personId,
      [...byCounterpart.entries()]
        .map(
          ([counterpart, messages]): MessageThread => ({
            personId,
            counterpart,
            messages: messages.sort((left, right) => left.timestampMs - right.timestampMs),
          }),
        )
        .sort((left, right) => left.counterpart.localeCompare(right.counterpart, "tr")),
    ]),
  );
};

const buildSummary = (records: InvestigationRecord[], people: PersonProfile[]) => {
  const sortedRecords = [...records].sort((left, right) => left.timestampMs - right.timestampMs);
  const podoRecords = records.filter((record) => record.people.includes("Podo"));
  const lastConfirmedSighting = [...records]
    .filter((record) => record.type === "sighting" && record.people.includes("Podo"))
    .sort((left, right) => right.timestampMs - left.timestampMs)[0];

  const primarySuspect = people.find((person) => person.displayName !== "Podo");

  return {
    lastConfirmedSighting:
      lastConfirmedSighting && lastConfirmedSighting.location
        ? {
            timestamp: lastConfirmedSighting.timestamp,
            location: lastConfirmedSighting.location,
            people: lastConfirmedSighting.people,
          }
        : undefined,
    primarySuspect: primarySuspect?.displayName,
    podoRelatedRecordCount: podoRecords.length,
    timelineStart: sortedRecords[0]?.timestamp,
    timelineEnd: sortedRecords.at(-1)?.timestamp,
  };
};

export const getInvestigation = async (): Promise<InvestigationApiResponse> => {
  // TODO: Add a short-lived in-memory cache if the frontend starts polling heavily.
  const rawData = await fetchAllFormSubmissions();
  const normalizedRecords = normalizeInvestigationRecords(rawData).sort(
    (left, right) => left.timestampMs - right.timestampMs,
  );

  const allPeople = normalizedRecords.flatMap((record) => record.people);
  const { aliasesById, displayNameById } = buildAliasDirectory(allPeople);
  const records = normalizeRecordPeople(normalizedRecords, displayNameById);
  const people = buildPeople(records, aliasesById, displayNameById);

  return {
    summary: buildSummary(records, people),
    people,
    records,
    messageThreadsByPerson: buildMessageThreads(records),
  };
};

export const getInvestigationPeople = async () => {
  const investigation = await getInvestigation();
  return investigation.people;
};

export const getInvestigationPerson = async (personId: string) => {
  const investigation = await getInvestigation();
  const person = investigation.people.find((entry) => entry.id === toPersonId(personId));

  if (!person) {
    return null;
  }

  return {
    person,
    records: investigation.records.filter((record) => record.people.includes(person.displayName)),
    messageThreads: investigation.messageThreadsByPerson[person.id] ?? [],
  };
};
