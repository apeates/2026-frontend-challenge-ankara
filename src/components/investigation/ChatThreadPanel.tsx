import { type ConversationEntry } from "../../types/investigation";
import { formatTime } from "../../utils/date";
import { normalizePersonKey } from "../../utils/investigation";

type ChatThreadPanelProps = {
  conversation: ConversationEntry | null;
  visibleMessages?: ConversationEntry["messages"];
  onSelectEvent: (recordId: string) => void;
};

export function ChatThreadPanel({
  conversation,
  visibleMessages,
  onSelectEvent,
}: ChatThreadPanelProps) {
  if (!conversation) {
    return <div className="empty-panel compact">Pick a conversation to inspect the message thread.</div>;
  }

  const renderedMessages = visibleMessages ?? conversation.messages;

  return (
    <div className="chat-thread">
      <header className="chat-thread-header">
        <div>
          <strong>{conversation.focusPersonName}</strong>
          <span> ↔ {conversation.counterpartName}</span>
        </div>
        <span>{renderedMessages.length} messages</span>
      </header>

      <div className="chat-thread-messages">
        {renderedMessages.map((message) => {
          const isOutgoing =
            normalizePersonKey(message.primaryPerson ?? "") === conversation.focusPersonId;

          return (
            <button
              key={message.id}
              className={`chat-bubble ${isOutgoing ? "is-outgoing" : "is-incoming"}`}
              onClick={() => onSelectEvent(message.id)}
            >
              <div className="chat-bubble-topline">
                <strong>{message.primaryPerson}</strong>
                <span>{formatTime(message.timestamp)}</span>
              </div>
              <p>{message.description}</p>
              <div className="chat-bubble-footer">
                <span>{message.location ?? "Unknown location"}</span>
                {message.urgency ? (
                  <span className={`urgency-badge urgency-${message.urgency}`}>{message.urgency}</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
