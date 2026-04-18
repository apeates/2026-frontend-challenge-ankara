import { type PersonProfile } from "../../types/investigation";

type SubjectsPanelProps = {
  people: PersonProfile[];
  selectedPersonId: string | null;
  onSelectPerson: (personId: string | null) => void;
};

const LEVEL_ORDER: Record<string, number> = { key: 4, high: 3, medium: 2, low: 1 };

function ScoreBar({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const color =
    clamped >= 80 ? "#fb7185" : clamped >= 50 ? "#fbbf24" : "#34d399";

  return (
    <div className="score-bar-wrap">
      <div
        className="score-bar-fill"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}

export function SubjectsPanel({
  people,
  selectedPersonId,
  onSelectPerson,
}: SubjectsPanelProps) {
  const podo = people.find((person) => person.id === "podo") ?? null;
  const suspects = [...people]
    .filter((p) => p.id !== "podo")
    .sort((a, b) => (LEVEL_ORDER[b.suspicionLevel] ?? 0) - (LEVEL_ORDER[a.suspicionLevel] ?? 0));

  return (
    <section className="panel subjects-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Şüpheliler</p>
          <h2>Subjects</h2>
        </div>
        {selectedPersonId ? (
          <button className="ghost-button" onClick={() => onSelectPerson(null)}>
            Clear
          </button>
        ) : null}
      </div>

      <div className="subject-list">
        <button
          className={`subject-card all-subjects ${selectedPersonId === null ? "is-active" : ""}`}
          onClick={() => onSelectPerson(null)}
        >
          <div>
            <h3>All Subjects</h3>
          </div>
        </button>

        {podo ? (
          <button
            className={`subject-card tracked-person ${selectedPersonId === podo.id ? "is-active" : ""}`}
            onClick={() => onSelectPerson(selectedPersonId === podo.id ? null : podo.id)}
          >
            <div className="subject-card-main">
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3>{podo.displayName}</h3>
                <p>{podo.recordCount} records · tracked route context</p>
              </div>
              <span className="level-badge tracked-badge">tracked</span>
            </div>
          </button>
        ) : null}

        {suspects.map((person) => (
          <button
            key={person.id}
            className={`subject-card level-${person.suspicionLevel} ${
              selectedPersonId === person.id ? "is-active" : ""
            }`}
            onClick={() => onSelectPerson(selectedPersonId === person.id ? null : person.id)}
          >
            <div className="subject-card-main">
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3>{person.displayName}</h3>
                <p>{person.recordCount} records</p>
              </div>
              <span className={`level-badge level-${person.suspicionLevel}`}>
                {person.suspicionLevel}
              </span>
            </div>
            <div className="subject-score-row">
              <ScoreBar score={person.suspicionScore} />
              <span className="score-label">{person.suspicionScore}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
