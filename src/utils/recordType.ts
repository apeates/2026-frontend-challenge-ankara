import { type RecordType } from "../types/investigation";

const RECORD_TYPE_TR: Record<RecordType, string> = {
  checkin: "Check-in",
  message: "Mesaj",
  sighting: "Görme",
  note: "Not",
  tip: "İhbar",
};

export function formatRecordType(type: RecordType): string {
  return RECORD_TYPE_TR[type] ?? type;
}
