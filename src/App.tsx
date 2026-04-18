import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { SummaryStrip } from "./components/investigation/SummaryStrip";
import { SubjectsPanel } from "./components/investigation/SubjectsPanel";
import { TimelinePanel } from "./components/investigation/TimelinePanel";
import { TopControlBar } from "./components/investigation/TopControlBar";
import { fetchInvestigation } from "./lib/jotform";
import { MessagesPage } from "./pages/MessagesPage";
import { SubjectChronologyPanel } from "./components/investigation/SubjectChronologyPanel";
import {
  buildPodoRoute,
  buildSubjectChronology,
  findDefaultSelectedRecordId,
  findPersonById,
  getFilteredRecords,
  sortRecordsByTimestamp,
} from "./utils/investigation";
import {
  type InvestigationApiResponse,
  type InvestigationRecord,
  type RecordType,
} from "./types/investigation";

const MapPanel = lazy(async () => {
  const module = await import("./components/investigation/MapPanel");
  return { default: module.MapPanel };
});

function InvestigationPage({
  data,
}: {
  data: InvestigationApiResponse;
}) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(() =>
    findDefaultSelectedRecordId(data),
  );
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [eventType, setEventType] = useState<RecordType | "all">("all");
  const [onlyPodo, setOnlyPodo] = useState(false);

  const records = data.records;
  const people = data.people;

  const filteredRecords = useMemo(
    () =>
      getFilteredRecords(records, {
        selectedPersonId,
        eventType,
        onlyPodo,
      }),
    [eventType, onlyPodo, records, selectedPersonId],
  );

  const selectedEvent =
    filteredRecords.find((record) => record.id === selectedEventId) ??
    records.find((record) => record.id === selectedEventId) ??
    filteredRecords[0] ??
    null;
  const selectedPerson = findPersonById(people, selectedPersonId);
  const route = buildPodoRoute(filteredRecords, selectedPersonId);
  const subjectChronology = buildSubjectChronology(filteredRecords, selectedPerson);

  useEffect(() => {
    if (!filteredRecords.length) {
      setSelectedEventId(null);
      return;
    }

    if (!filteredRecords.some((record) => record.id === selectedEventId)) {
      setSelectedEventId(filteredRecords[0].id);
    }
  }, [filteredRecords, selectedEventId]);

  const handleReset = () => {
    setSelectedPersonId(null);
    setEventType("all");
    setOnlyPodo(false);
  };

  const handleSelectEvent = (record: InvestigationRecord) => {
    setSelectedEventId(record.id);
  };

  return (
    <div className="dashboard dashboard-spacious">
      <header className="app-topbar">
        <div className="brand-block">
          <p className="eyebrow">Missing Podo: The Ankara Case</p>
          <h1>Investigation Dashboard</h1>
        </div>
        <nav className="page-nav">
          <NavLink end to="/" className={({ isActive }) => `nav-pill ${isActive ? "is-active" : ""}`}>
            Investigation
          </NavLink>
          <NavLink
            to={selectedPersonId ? `/messages?person=${selectedPersonId}` : "/messages"}
            className={({ isActive }) => `nav-pill ${isActive ? "is-active" : ""}`}
          >
            Messages
          </NavLink>
        </nav>
      </header>

      <SummaryStrip
        summary={data.summary}
        visibleRecordCount={filteredRecords.length}
        activePerson={selectedPerson?.displayName ?? null}
        onlyPodo={onlyPodo}
      />

      <TopControlBar
        people={people}
        eventType={eventType}
        selectedPersonId={selectedPersonId}
        onlyPodo={onlyPodo}
        onEventTypeChange={setEventType}
        onPersonChange={setSelectedPersonId}
        onOnlyPodoChange={setOnlyPodo}
        onReset={handleReset}
      />

      <main className="investigation-main-layout">
        <aside className="subjects-column spacious-column">
          <SubjectsPanel
            people={people}
            selectedPersonId={selectedPersonId}
            onSelectPerson={setSelectedPersonId}
          />
        </aside>

        <section className="map-column spacious-column">
          <Suspense
            fallback={<section className="panel map-panel-skeleton">Loading map layer...</section>}
          >
            <MapPanel
              records={filteredRecords}
              selectedEvent={selectedEvent}
              route={route}
              onSelectEvent={handleSelectEvent}
            />
          </Suspense>
        </section>

        <aside className="chronology-column spacious-column">
          <SubjectChronologyPanel
            selectedPerson={selectedPerson}
            selectedEventId={selectedEvent?.id ?? null}
            chronology={subjectChronology}
            onSelectEvent={handleSelectEvent}
          />
        </aside>
      </main>

      <TimelinePanel
        records={filteredRecords}
        route={route}
        selectedEventId={selectedEvent?.id ?? null}
        onSelectEvent={handleSelectEvent}
      />
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<InvestigationApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchInvestigation()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setData({
          ...response,
          records: sortRecordsByTimestamp(response.records),
        });
      })
      .catch((fetchError) => {
        console.error(fetchError);
        setError(
          "Investigation API could not be reached. Make sure the backend is running with `npm run server:dev`.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div className="loading-screen">Loading investigation board...</div>;
  }

  if (error) {
    return <div className="error-screen">{error}</div>;
  }

  if (!data) {
    return null;
  }

  return (
    <Routes>
      <Route path="/" element={<InvestigationPage data={data} />} />
      <Route
        path="/messages"
        element={
          <MessagesPage
            records={data.records}
            people={data.people}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
