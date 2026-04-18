import { type InvestigationSummary } from "../../types/investigation";
import { formatDateTime } from "../../utils/date";

type SummaryStripProps = {
  summary: InvestigationSummary;
  visibleRecordCount: number;
  activePerson: string | null;
  onlyPodo: boolean;
};

export function SummaryStrip({
  summary,
  visibleRecordCount,
  activePerson,
  onlyPodo,
}: SummaryStripProps) {
  return (
    <section className="top-summary">
      <div className="case-title-block">
        <p className="eyebrow">Missing Podo: The Ankara Case</p>
        <h1>Case Investigation: Alpha</h1>
        <p className="summary-subline">
          {summary.timelineStart ? formatDateTime(summary.timelineStart) : "Unknown start"}
          <span className="summary-separator">-</span>
          {summary.timelineEnd ? formatDateTime(summary.timelineEnd) : "Unknown end"}
        </p>
      </div>

      <div className="compact-stats">
        <article className="mini-stat">
          <span>Primary suspect</span>
          <strong>{summary.primarySuspect ?? "Unknown"}</strong>
        </article>
        <article className="mini-stat">
          <span>Visible events</span>
          <strong>{visibleRecordCount}</strong>
        </article>
        <article className="mini-stat">
          <span>Podo related</span>
          <strong>{summary.podoRelatedRecordCount}</strong>
        </article>
        <article className="mini-stat">
          <span>Filter focus</span>
          <strong>{activePerson ?? (onlyPodo ? "Podo only" : "All subjects")}</strong>
        </article>
      </div>
    </section>
  );
}
