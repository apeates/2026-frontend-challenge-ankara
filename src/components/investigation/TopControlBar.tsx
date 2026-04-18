import { type ChangeEvent } from "react";
import { type PersonProfile, type RecordType } from "../../types/investigation";

type TopControlBarProps = {
  people: PersonProfile[];
  eventType: RecordType | "all";
  selectedPersonId: string | null;
  onlyPodo: boolean;
  onEventTypeChange: (value: RecordType | "all") => void;
  onPersonChange: (value: string | null) => void;
  onOnlyPodoChange: (value: boolean) => void;
  onReset: () => void;
};

const EVENT_TYPES: Array<RecordType | "all"> = [
  "all",
  "checkin",
  "message",
  "sighting",
  "note",
  "tip",
];

export function TopControlBar({
  people,
  eventType,
  selectedPersonId,
  onlyPodo,
  onEventTypeChange,
  onPersonChange,
  onOnlyPodoChange,
  onReset,
}: TopControlBarProps) {
  const handlePersonChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onPersonChange(event.target.value ? event.target.value : null);
  };

  return (
    <section className="control-bar">
      <label className="control-chip">
        <span>Event type</span>
        <select value={eventType} onChange={(event) => onEventTypeChange(event.target.value as RecordType | "all")}>
          {EVENT_TYPES.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All events" : option}
            </option>
          ))}
        </select>
      </label>

      <label className="control-chip">
        <span>Subject</span>
        <select value={selectedPersonId ?? ""} onChange={handlePersonChange}>
          <option value="">All subjects</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.displayName}
            </option>
          ))}
        </select>
      </label>

      <label className={`toggle-chip ${onlyPodo ? "is-active" : ""}`}>
        <input
          type="checkbox"
          checked={onlyPodo}
          onChange={(event) => onOnlyPodoChange(event.target.checked)}
        />
        <span>Podo only</span>
      </label>

      <button className="reset-chip" onClick={onReset}>
        Reset filters
      </button>
    </section>
  );
}
