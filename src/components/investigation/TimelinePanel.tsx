import { useRef } from "react";
import { type InvestigationRecord, type RouteStop } from "../../types/investigation";
import { formatTime } from "../../utils/date";
import { formatRecordType } from "../../utils/recordType";

type TimelinePanelProps = {
  records: InvestigationRecord[];
  route: RouteStop[];
  selectedEventId: string | null;
  onSelectEvent: (record: InvestigationRecord) => void;
};

export function TimelinePanel({
  records,
  route,
  selectedEventId,
  onSelectEvent,
}: TimelinePanelProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const routeSequenceByRecordId = new Map(route.map((stop) => [stop.recordId, stop.sequence]));

  return (
    <section className="timeline-rail panel">
      <div className="panel-heading compact rail-heading">
        <div>
          <p className="eyebrow">Event Rail</p>
          <h2>Chronology</h2>
        </div>
        <span className="rail-meta">{records.length} events</span>
      </div>

      <div
        ref={railRef}
        className="timeline-rail-track"
        onWheel={(event) => {
          if (!railRef.current || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
            return;
          }

          event.preventDefault();
          railRef.current.scrollBy({
            left: event.deltaY,
            behavior: "auto",
          });
        }}
      >
        {records.map((record) => {
          const routeSequence = routeSequenceByRecordId.get(record.id);

          return (
            <button
              key={record.id}
              className={`rail-card ${record.id === selectedEventId ? "is-selected" : ""}`}
              onClick={() => onSelectEvent(record)}
            >
              <div className="rail-card-topline">
                {routeSequence ? <span className="rail-sequence">{routeSequence}</span> : null}
                <span className={`record-pill type-${record.type}`}>{formatRecordType(record.type)}</span>
                <span className="rail-time">{formatTime(record.timestamp)}</span>
              </div>
              <strong>{record.title}</strong>
              <p>{record.location ?? "Unknown location"}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
