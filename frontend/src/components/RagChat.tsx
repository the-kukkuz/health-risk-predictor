import { useState, useRef, useEffect } from "react";
import Icon from "./Icon";

// RAG chat slide-in panel. Design-first stub: shows a polished chat surface
// with a placeholder composer. Functionality (grounded Q&A, SOS rules) is
// future work. The panel is wider, has better visual hierarchy, and feels
// more like a professional assistant than a basic chat box.
export default function RagChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    {
      role: "assistant",
      text: "I can help explain this risk assessment and answer questions about the factors involved. Ask me anything about this result.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    if (!input.trim() || isTyping) return;
    const userMessage = input.trim();
    setMessages((m) => [...m, { role: "user", text: userMessage }]);
    setInput("");
    setIsTyping(true);

    // Simulate async response (placeholder until RAG is wired)
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "This is a placeholder response. The RAG Q&A layer is not yet connected.",
        },
      ]);
      setIsTyping(false);
    }, 800);
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary-container text-on-primary px-5 py-3.5 shadow-lg hover:shadow-xl hover:bg-primary transition-all duration-200"
        aria-label="Ask about this result"
      >
        <Icon name="chat" className="text-[20px]" />
        <span className="text-sm font-semibold">Ask about this result</span>
      </button>

      {/* Slide-in panel */}
      {open && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface-container-lowest border-l border-outline-variant shadow-2xl flex flex-col animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant bg-surface-container-low">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center">
                <Icon name="chat" className="text-primary text-[18px]" />
              </div>
              <div>
                <h3 className="text-headline-sm text-on-surface font-semibold">
                  Risk Assistant
                </h3>
                <p className="text-caption text-on-surface-variant">
                  Explain this result
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition"
              aria-label="Close"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center mr-2 shrink-0 mt-1">
                    <Icon name="chat" className="text-primary text-[14px]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-on-primary rounded-br-sm"
                      : "bg-surface-container text-on-surface rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center mr-2 shrink-0 mt-1">
                  <Icon name="chat" className="text-primary text-[14px]" />
                </div>
                <div className="bg-surface-container rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-on-surface-variant/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-on-surface-variant/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-on-surface-variant/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-outline-variant p-4 bg-surface-container-lowest">
            <div className="flex gap-2">
              <input
                className="flex-1 input-field rounded-xl !py-3"
                placeholder="Ask about this result..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                disabled={isTyping}
              />
              <button
                onClick={send}
                disabled={!input.trim() || isTyping}
                className="btn-primary !px-5 !py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Send"
              >
                <Icon name="send" className="text-[18px]" />
              </button>
            </div>
            <p className="text-caption text-on-surface-variant mt-2 text-center">
              Grounded in clinical data • Not medical advice
            </p>
          </div>
        </div>
      )}
    </>
  );
}
