import { useState, useRef, useEffect } from "react";
import Icon from "./Icon";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface Props {
  /** Context string seeded into the opening assistant message */
  context?: string;
  /** If true (default), chat starts collapsed behind a trigger button */
  startCollapsed?: boolean;
}

function getInitialMessages(context?: string): Message[] {
  return [
    {
      role: "assistant",
      text: context
        ? `I can help explain this ${context}. Ask me anything about the risk factors, what they mean clinically, or what lifestyle changes may help.`
        : "I can help explain this risk assessment and answer questions about the contributing factors. What would you like to know?",
    },
  ];
}

const SUGGESTIONS = [
  "What does this risk level mean?",
  "What are the top risk factors?",
  "How can I reduce my risk?",
  "Should I see a doctor?",
];

/**
 * InlineChat — light-themed chatbot embedded inline in the page.
 * Starts collapsed behind a small trigger button; expands on click.
 */
export default function InlineChat({ context, startCollapsed = true }: Props) {
  const [open, setOpen] = useState(!startCollapsed);
  const [messages, setMessages] = useState<Message[]>(() => getInitialMessages(context));
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages(getInitialMessages(context));
    setShowSuggestions(true);
  }, [context]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  function send(text?: string) {
    const userMessage = (text ?? input).trim();
    if (!userMessage || isTyping) return;
    setInput("");
    setShowSuggestions(false);
    setMessages((m) => [...m, { role: "user", text: userMessage }]);
    setIsTyping(true);

    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "This is a placeholder response. The RAG Q&A layer will be connected to the clinical knowledge base. I'll be able to give detailed, evidence-based answers about this specific result.",
        },
      ]);
      setIsTyping(false);
    }, 900);
  }

  return (
    <div className="space-y-0">
      {/* ── Trigger button (shown when collapsed) ── */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between gap-3 px-5 py-3.5
            bg-surface-container-lowest border border-outline-variant rounded-xl
            hover:border-primary hover:bg-primary/5 group transition-all duration-200"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="smart_toy" className="text-primary text-[16px]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                Have questions about your result?
              </p>
              <p className="text-caption text-on-surface-variant">Ask the Risk Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-primary shrink-0">
            <span className="text-xs font-medium hidden sm:block">Chat now</span>
            <Icon name="arrow_forward" className="text-[18px] group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      ) : (
        <div className="card overflow-hidden animate-chat-open">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant bg-surface-container-low/50">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon name="smart_toy" className="text-primary text-[18px]" />
        </div>
        <div>
          <h3 className="text-headline-sm text-on-surface">Risk Assistant</h3>
          <p className="text-caption text-on-surface-variant">Ask about this result</p>
        </div>
        {/* Live dot */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
          </span>
          <span className="text-caption text-tertiary font-medium">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="h-72 overflow-y-auto px-5 py-4 space-y-4 bg-background">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="smart_toy" className="text-primary text-[14px]" />
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[#1d4ed8] text-white rounded-br-sm"
                  : "bg-surface-container-lowest border border-outline-variant text-on-surface rounded-bl-sm shadow-card"
              }`}
            >
              {m.text}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="person" className="text-on-surface-variant text-[14px]" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Icon name="smart_toy" className="text-primary text-[14px]" />
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-card">
              <div className="flex gap-1 items-center h-4">
                {[0, 150, 300].map((d) => (
                  <div
                    key={d}
                    className="w-1.5 h-1.5 bg-on-surface-variant/30 rounded-full animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips */}
      {showSuggestions && messages.length <= 1 && (
        <div className="px-5 py-3 border-t border-outline-variant flex flex-wrap gap-2 bg-surface-container-low/30">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            className="flex-1 input-field"
            placeholder="Ask about risk factors, lifestyle changes..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            disabled={isTyping}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#1d4ed8] text-white
              hover:bg-primary transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            aria-label="Send"
          >
            <Icon name="arrow_upward" className="text-[18px]" />
          </button>
        </div>
        <p className="text-[10px] text-on-surface-variant/60 text-center mt-2">
          Grounded in clinical data · Not a substitute for medical advice
        </p>
      </div>
    </div>
      )}
    </div>
  );
}
