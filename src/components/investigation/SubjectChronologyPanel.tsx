import {
  type InvestigationRecord,
  type PersonProfile,
  type SubjectChronologyEntry,
} from "../../types/investigation";
import { formatDateTime, formatTime } from "../../utils/date";

type SubjectChronologyPanelProps = {
  selectedPerson: PersonProfile | null;
  selectedEventId: string | null;
  chronology: SubjectChronologyEntry[];
  onSelectEvent: (record: InvestigationRecord) => void;
};

export function SubjectChronologyPanel({
  selectedPerson,
  selectedEventId,
  chronology,
  onSelectEvent,
}: SubjectChronologyPanelProps) {
  return (
    <section className="panel chronology-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Subject Progression</p>
          <h2>{selectedPerson ? selectedPerson.displayName : "General Timeline"}</h2>
        </div>
        {selectedPerson ? (
          <span className={`level-badge level-${selectedPerson.suspicionLevel}`}>
            {selectedPerson.suspicionLevel}
          </span>
        ) : null}
      </div>

      <div className="chronology-summary">
        {selectedPerson ? (
          selectedPerson.id === "podo" ? (
            <p>
              Podo is shown as tracked movement context only. This panel focuses on route progression,
              sightings, and last known path rather than suspicion scoring.
            </p>
          ) : (
            <p>
              Events are sorted chronologically for {selectedPerson.displayName}, with each row showing
              how much that record raises or lowers the subject-specific investigation score.
            </p>
          )
        ) : (
          <p>Select a subject to inspect their chronology and suspicion progression over time.</p>
        )}
      </div>

      <div className="chronology-list">
        {chronology.length ? (
          chronology.map((entry) => (
            <button
              key={entry.record.id}
              className={`chronology-row ${
                entry.record.id === selectedEventId ? "is-selected" : ""
              }`}
              onClick={() => onSelectEvent(entry.record)}
            >
              <div className="chronology-row-topline">
                <span>{formatTime(entry.record.timestamp)}</span>
                {entry.isScored ? (
                  <span className={`score-delta ${entry.delta >= 0 ? "is-positive" : "is-negative"}`}>
                    {entry.delta >= 0 ? "+" : ""}
                    {entry.delta}
                  </span>
                ) : (
                  <span className="route-context-badge">Route context</span>
                )}
              </div>
              <strong>{entry.record.title}</strong>
              <p>{entry.reason}</p>
              <div className="chronology-row-footer">
                <span>{entry.record.location ?? "Unknown location"}</span>
                <span>{entry.isScored ? `Score ${entry.cumulativeScore}` : "Tracked path"}</span>
              </div>
              <span className="chronology-datetime">{formatDateTime(entry.record.timestamp)}</span>
            </button>
          ))
        ) : (
          <div className="empty-panel compact">No subject-specific chronology for the current filters.</div>
        )}
      </div>
    </section>
  );
}
