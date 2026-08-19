import { useState } from "react";
import Icon from "./Icon";

// RAG chat slide-in panel. Design-first stub: shows a chat surface with a
// placeholder composer. Functionality (grounded Q&A, SOS rules) is future work.
export default function RagChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    {
      role: "assistant",
      text: "Hi, I can help explain this risk assessment and answer questions about the factors involved. Ask me anything about this result.",
    },
  ]);
  const [input, setInput] = useState("");

  function send() {
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: "user", text: input }]);
    setInput("");
    // Stub: no backend yet. Reply is placeholder until RAG is wired.
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text: "This is a placeholder response. The RAG Q&A layer is not yet connected.",
      },
    ]);
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary-container text-on-primary px-4 py-3 shadow-card-hover hover:bg-primary transition"
        aria-label="Ask about this result"
      >
        <Icon name="chat" className="text-[20px]" />
        <span className="text-sm font-medium">Ask</span>
      </button>

      {/* Slide-in panel */}
      {open && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-surface-container-lowest border-l border-outline-variant shadow-card-hover flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
            <div className="flex items-center gap-2">
              <Icon name="chat" className="text-primary text-[20px]" />
              <h3 className="text-headline-sm text-on-surface">Ask about this result</h3>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-low"
              aria-label="Close"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-primary-container text-on-primary"
                    : "bg-surface-container text-on-surface"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="border-t border-outline-variant p-3 flex gap-2">
            <input
              className="input-field"
              placeholder="Ask about this result..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button onClick={send} className="btn-primary !px-3" aria-label="Send">
              <Icon name="send" className="text-[18px]" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
