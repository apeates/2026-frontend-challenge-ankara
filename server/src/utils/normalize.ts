import {
  type InvestigationRecord,
  type RawJotformSubmission,
  type RecordType,
  type SignalLevel,
} from "../types/investigation.js";
import {
  answersByName,
  parseCoordinates,
  parseSubmissionDateLabel,
  parseTimestamp,
  splitPeople,
} from "./parse.js";

const toSignalLevel = (value?: string): SignalLevel | undefined => {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return undefined;
};

const uniquePeople = (people: Array<string | undefined>) =>
  [
    ...new Set(
      people
        .filter((value): value is string => Boolean(value && value.trim()))
        .map((value) => value.trim()),
    ),
  ];

const buildRecord = ({
  raw,
  type,
  title,
  description,
  people,
  primaryPerson,
  secondaryPerson,
  location,
  coordinates,
  urgency,
  confidence,
  timestamp,
  timestampMs,
}: {
  raw: RawJotformSubmission;
  type: RecordType;
  title: string;
  description: string;
  people: string[];
  primaryPerson?: string;
  secondaryPerson?: string;
  location?: string;
  coordinates?: string;
  urgency?: SignalLevel;
  confidence?: SignalLevel;
  timestamp: string;
  timestampMs: number;
}): InvestigationRecord => ({
  id: raw.id,
  type,
  timestamp,
  timestampMs,
  location: location?.trim() || undefined,
  coordinates: parseCoordinates(coordinates),
  title,
  description,
  people: uniquePeople(people),
  primaryPerson,
  secondaryPerson,
  urgency,
  confidence,
  rawSource: raw,
});

export const normalizeCheckin = (raw: RawJotformSubmission) => {
  const answers = answersByName(raw.answers);
  const person = answers.personName;
  const time = parseTimestamp(answers.timestamp, raw.created_at);
  const note = answers.note || `${person} checked in.`;

  return buildRecord({
    raw,
    type: "checkin",
    timestamp: time.timestamp,
    timestampMs: time.timestampMs,
    title: `${person} checked in`,
    description: note,
    people: [person],
    primaryPerson: person,
    location: answers.location,
    coordinates: answers.coordinates,
  });
};

export const normalizeMessage = (raw: RawJotformSubmission) => {
  const answers = answersByName(raw.answers);
  const sender = answers.senderName;
  const recipient = answers.recipientName;
  const time = parseTimestamp(answers.timestamp, raw.created_at);

  return buildRecord({
    raw,
    type: "message",
    timestamp: time.timestamp,
    timestampMs: time.timestampMs,
    title: `Message: ${sender} -> ${recipient}`,
    description: answers.text || "",
    people: [sender, recipient],
    primaryPerson: sender,
    secondaryPerson: recipient,
    location: answers.location,
    coordinates: answers.coordinates,
    urgency: toSignalLevel(answers.urgency),
  });
};

export const normalizeSighting = (raw: RawJotformSubmission) => {
  const answers = answersByName(raw.answers);
  const person = answers.personName;
  const seenWith = answers.seenWith;
  const time = parseTimestamp(answers.timestamp, raw.created_at);

  return buildRecord({
    raw,
    type: "sighting",
    timestamp: time.timestamp,
    timestampMs: time.timestampMs,
    title: `Sighting: ${person} with ${seenWith}`,
    description: answers.note || "",
    people: [person, seenWith],
    primaryPerson: person,
    secondaryPerson: seenWith,
    location: answers.location,
    coordinates: answers.coordinates,
  });
};

export const normalizeNote = (raw: RawJotformSubmission) => {
  const answers = answersByName(raw.answers);
  const author = answers.authorName;
  const mentionedPeople = splitPeople(answers.mentionedPeople);
  const time = parseTimestamp(answers.timestamp, raw.created_at);

  return buildRecord({
    raw,
    type: "note",
    timestamp: time.timestamp,
    timestampMs: time.timestampMs,
    title: `Personal note by ${author}`,
    description: answers.note || "",
    people: [author, ...mentionedPeople],
    primaryPerson: author,
    secondaryPerson: mentionedPeople[0],
    location: answers.location,
    coordinates: answers.coordinates,
  });
};

export const normalizeTip = (raw: RawJotformSubmission) => {
  const answers = answersByName(raw.answers);
  const suspect = answers.suspectName;
  const time = parseTimestamp(answers.timestamp, raw.created_at);
  const submittedOn = parseSubmissionDateLabel(answers.submissionDate);
  const tipText = submittedOn
    ? `${answers.tip || ""} Submitted anonymously on ${submittedOn}.`
    : answers.tip || "";

  return buildRecord({
    raw,
    type: "tip",
    timestamp: time.timestamp,
    timestampMs: time.timestampMs,
    title: `Anonymous tip about ${suspect}`,
    description: tipText.trim(),
    people: [suspect],
    primaryPerson: suspect,
    location: answers.location,
    coordinates: answers.coordinates,
    confidence: toSignalLevel(answers.confidence),
  });
};

export const normalizeInvestigationRecords = (rawData: {
  checkins: RawJotformSubmission[];
  messages: RawJotformSubmission[];
  sightings: RawJotformSubmission[];
  notes: RawJotformSubmission[];
  tips: RawJotformSubmission[];
}) => [
  ...rawData.checkins.map(normalizeCheckin),
  ...rawData.messages.map(normalizeMessage),
  ...rawData.sightings.map(normalizeSighting),
  ...rawData.notes.map(normalizeNote),
  ...rawData.tips.map(normalizeTip),
];
