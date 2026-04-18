export type SignalLevel = "low" | "medium" | "high";
export type SuspicionLevel = "key" | "low" | "medium" | "high";
export type RecordType = "checkin" | "message" | "sighting" | "note" | "tip";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type InvestigationRecord = {
  id: string;
  type: RecordType;
  timestamp: string;
  timestampMs?: number;
  location?: string;
  coordinates?: Coordinates | string | null;
  title: string;
  description: string;
  people: string[];
  primaryPerson?: string;
  secondaryPerson?: string;
  urgency?: SignalLevel;
  confidence?: SignalLevel;
};

export type PersonProfile = {
  id: string;
  displayName: string;
  aliases: string[];
  suspicionLevel: SuspicionLevel;
  suspicionScore: number;
  recordCount: number;
};

export type MessageThread = {
  personId: string;
  counterpart: string;
  messages: InvestigationRecord[];
};

export type InvestigationSummary = {
  lastConfirmedSighting?: {
    timestamp: string;
    location: string;
    people: string[];
  };
  primarySuspect?: string;
  podoRelatedRecordCount: number;
  timelineStart?: string;
  timelineEnd?: string;
};

export type InvestigationApiResponse = {
  summary: InvestigationSummary;
  people: PersonProfile[];
  records: InvestigationRecord[];
  messageThreadsByPerson: Record<string, MessageThread[]>;
};

export type RouteStop = {
  recordId: string;
  lat: number;
  lng: number;
  timestamp: string;
  title: string;
  sequence: number;
};

export type InvestigationFilters = {
  selectedPersonId: string | null;
  eventType: RecordType | "all";
  onlyPodo: boolean;
};

export type ConversationEntry = {
  id: string;
  focusPersonId: string;
  focusPersonName: string;
  counterpartId: string;
  counterpartName: string;
  messages: InvestigationRecord[];
  lastMessage: InvestigationRecord;
};

export type SubjectChronologyEntry = {
  record: InvestigationRecord;
  delta: number;
  cumulativeScore: number;
  reason: string;
  isScored: boolean;
};
