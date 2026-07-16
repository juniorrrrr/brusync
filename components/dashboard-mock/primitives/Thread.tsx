export interface ThreadMessage {
  from: "in" | "out" | "ai";
  text: string;
  time: string;
}

export function Thread({ messages }: { messages: ThreadMessage[] }) {
  return (
    <div className="thread">
      {messages.map((msg) => (
        <div className={`msg ${msg.from}`} key={`${msg.from}-${msg.time}-${msg.text.slice(0, 12)}`}>
          {msg.text}
          <span className="msg-time">{msg.time}</span>
        </div>
      ))}
    </div>
  );
}
