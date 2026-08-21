import { Send } from "lucide-react";
import { useState } from "react";
import type { ChatMessage } from "../../types/itinerary";

interface FollowUpChatProps {
  disabled: boolean;
  messages: ChatMessage[];
  suggestions: string[];
  onSend: (message: string) => void;
}

export default function FollowUpChat({
  disabled,
  messages,
  suggestions,
  onSend,
}: FollowUpChatProps) {
  const [message, setMessage] = useState("");

  const submitMessage = (nextMessage = message) => {
    if (!nextMessage.trim()) return;
    onSend(nextMessage);
    setMessage("");
  };

  return (
    <aside className="planner-chat" aria-label="Refine itinerary">
      <div className="planner-chat-log">
        {messages.slice(-4).map((chatMessage) => (
          <p className={chatMessage.role} key={chatMessage.id}>
            {chatMessage.content}
          </p>
        ))}
      </div>

      <div className="planner-suggestions">
        {suggestions.slice(0, 3).map((suggestion) => (
          <button
            type="button"
            key={suggestion}
            onClick={() => submitMessage(suggestion)}
            disabled={disabled}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form
        className="planner-chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          submitMessage();
        }}
      >
        <label>
          <span>Refine this journey</span>
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Try: make it 4 days or add Ella"
            disabled={disabled}
          />
        </label>
        <button type="submit" disabled={disabled || !message.trim()}>
          <span>Send</span>
          <Send size={18} />
        </button>
      </form>
    </aside>
  );
}
