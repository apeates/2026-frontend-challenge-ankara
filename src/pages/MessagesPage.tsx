import { useEffect, useMemo, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { ChatThreadPanel } from "../components/investigation/ChatThreadPanel";
import { ConversationList } from "../components/investigation/ConversationList";
import { type InvestigationRecord, type PersonProfile } from "../types/investigation";
import { buildConversationEntries, filterConversationMessages } from "../utils/investigation";

type MessagesPageProps = {
  records: InvestigationRecord[];
  people: PersonProfile[];
};

export function MessagesPage({ records, people }: MessagesPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPerson = searchParams.get("person");
  const [activePersonId, setActivePersonId] = useState<string | null>(initialPerson);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    setActivePersonId(initialPerson);
  }, [initialPerson]);

  const scopedConversations = useMemo(() => {
    const focusPersonId = activePersonId ?? "podo";
    return buildConversationEntries(records, people, focusPersonId, searchTerm);
  }, [activePersonId, people, records, searchTerm]);

  useEffect(() => {
    if (!scopedConversations.length) {
      setActiveConversationId(null);
      return;
    }

    if (!activeConversationId || !scopedConversations.some((entry) => entry.id === activeConversationId)) {
      setActiveConversationId(scopedConversations[0].id);
    }
  }, [activeConversationId, scopedConversations]);

  const activeConversation =
    scopedConversations.find((entry) => entry.id === activeConversationId) ?? scopedConversations[0] ?? null;
  const visibleMessages = filterConversationMessages(activeConversation, searchTerm);

  return (
    <div className="dashboard messages-dashboard">
      <header className="app-topbar">
        <div className="brand-block">
          <p className="eyebrow">Missing Podo: The Ankara Case</p>
          <h1>Messages</h1>
        </div>
        <nav className="page-nav">
          <NavLink end to="/" className={({ isActive }) => `nav-pill ${isActive ? "is-active" : ""}`}>
            Investigation
          </NavLink>
          <NavLink to="/messages" className={({ isActive }) => `nav-pill ${isActive ? "is-active" : ""}`}>
            Messages
          </NavLink>
        </nav>
      </header>

      <section className="messages-toolbar">
        <label className="control-chip">
          <span>Conversation focus</span>
          <select
            value={activePersonId ?? ""}
            onChange={(event) => {
              const nextValue = event.target.value || null;
              setActivePersonId(nextValue);
              setSearchParams(nextValue ? { person: nextValue } : {});
            }}
          >
            <option value="">Podo conversations</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </select>
        </label>

        <label className="control-chip search-chip">
          <span>Message search</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search names or message text"
          />
        </label>
      </section>

      <main className="messages-layout">
        <section className="panel messages-sidebar">
          <div className="panel-heading compact">
            <div>
              <p className="eyebrow">Conversation List</p>
              <h2>
                {activePersonId
                  ? people.find((person) => person.id === activePersonId)?.displayName ?? "Selected person"
                  : "Podo Threads"}
              </h2>
            </div>
          </div>
          <ConversationList
            conversations={scopedConversations}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
          />
        </section>

        <section className="panel messages-thread-panel">
          <div className="panel-heading compact">
            <div>
              <p className="eyebrow">Chat Thread</p>
              <h2>{activeConversation?.counterpartName ?? "No thread selected"}</h2>
            </div>
          </div>
          <ChatThreadPanel
            conversation={activeConversation}
            visibleMessages={visibleMessages}
            onSelectEvent={() => undefined}
          />
        </section>
      </main>
    </div>
  );
}
