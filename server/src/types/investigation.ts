export type RecordType = "checkin" | "message" | "sighting" | "note" | "tip";

export type SignalLevel = "low" | "medium" | "high";
export type SuspicionLevel = "key" | "low" | "medium" | "high";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type InvestigationRecord = {
  id: string;
  type: RecordType;
  timestamp: string;
  timestampMs: number;
  location?: string;
  coordinates?: Coordinates | null;
  title: string;
  description: string;
  people: string[];
  primaryPerson?: string;
  secondaryPerson?: string;
  urgency?: SignalLevel;
  confidence?: SignalLevel;
  rawSource?: unknown;
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

export type RawJotformAnswer = {
  answer?: string;
  name?: string;
  order?: string;
  text?: string;
  type?: string;
};

export type RawJotformSubmission = {
  id: string;
  form_id: string;
  created_at?: string;
  updated_at?: string | null;
  answers?: Record<string, RawJotformAnswer>;
};

export type JotformSubmissionResponse = {
  responseCode: number;
  message: string;
  content: RawJotformSubmission[];
};
