import { type ConversationEntry } from "../../types/investigation";
import { formatTime } from "../../utils/date";

type ConversationListProps = {
  conversations: ConversationEntry[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
};

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
}: ConversationListProps) {
  if (!conversations.length) {
    return <div className="empty-panel compact">No conversations match the current filters.</div>;
  }

  return (
    <div className="conversation-list">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          className={`conversation-row ${
            conversation.id === activeConversationId ? "is-active" : ""
          }`}
          onClick={() => onSelectConversation(conversation.id)}
        >
          <div className="conversation-avatar">{conversation.counterpartName.slice(0, 1)}</div>
          <div className="conversation-copy">
            <div className="conversation-topline">
              <strong>{conversation.counterpartName}</strong>
              <span>{formatTime(conversation.lastMessage.timestamp)}</span>
            </div>
            <p>{conversation.lastMessage.description}</p>
          </div>
          {conversation.lastMessage.urgency ? (
            <span className={`urgency-dot urgency-${conversation.lastMessage.urgency}`} />
          ) : null}
        </button>
      ))}
    </div>
  );
}
