"use client";

import { CSSProperties, FormEvent, useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
  error?: boolean;
};

type OrvenixChatBridge = {
  __ready: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  internalQuery: (prompt: string, visible?: boolean, context?: Record<string, unknown>) => Promise<void>;
};

const STORAGE_KEY = "orvenix-chat-history";
const MAX_HISTORY = 12;
const DEFAULT_MESSAGES: ChatMessage[] = [{ role: "assistant", content: getDefaultWelcomeMessage() }];

function getDefaultWelcomeMessage() {
  return "Hola, soy orvenix. Puedo ayudarte con precios, plataforma, editor visual, plantillas reales, demos por industria y el proceso para lanzar tu sitio.";
}

const SUGGESTIONS = [
  "Que incluye la Plataforma Orvenix?",
  "Cuanto cuesta un sitio?",
  "Como funciona el editor?",
];

function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [{ role: "assistant", content: getDefaultWelcomeMessage() }];

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    if (Array.isArray(stored)) {
      const messages = stored.filter(
        (message): message is ChatMessage =>
          typeof message === "object" &&
          message !== null &&
          ((message as ChatMessage).role === "assistant" || (message as ChatMessage).role === "user") &&
          typeof (message as ChatMessage).content === "string"
      );
      if (messages.length > 0) return messages.slice(-MAX_HISTORY);
    }
  } catch {
    // Ignorar historial corrupto.
  }

  return [{ role: "assistant", content: getDefaultWelcomeMessage() }];
}

function parseSseText(raw: string) {
  let output = "";

  raw.split(/\n\n+/).forEach((chunk) => {
    chunk.split(/\n/).forEach((line) => {
      if (!line.startsWith("data: ")) return;
      const payload = line.slice(6).trim();
      if (!payload || payload === "[DONE]") return;

      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: { text?: string };
        };
        if (
          (event.type === "content_block_delta" || event.type === "message_delta") &&
          typeof event.delta?.text === "string"
        ) {
          output += event.delta.text;
        }
      } catch {
        // Ignorar fragmentos SSE parciales.
      }
    });
  });

  return output.trim();
}

async function readAssistantResponse(response: Response, onText: (text: string) => void) {
  if (!response.body || !response.body.getReader) {
    const text = parseSseText(await response.text());
    onText(text);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const result = await reader.read();
    if (result.done) break;
    buffer += decoder.decode(result.value, { stream: true });
    const text = parseSseText(buffer);
    if (text) onText(text);
  }

  const finalText = parseSseText(buffer);
  if (finalText) onText(finalText);
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [panelEyeOffset, setPanelEyeOffset] = useState({ x: 0, y: 0 });
  const botRef = useRef<HTMLButtonElement | null>(null);
  const panelBotRef = useRef<HTMLSpanElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef(messages);
  const sendMessageRef = useRef<(rawText: string, visible?: boolean) => Promise<void>>(async () => {});
  const isBusy = isSending || isTyping;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const history = loadHistory();
      messagesRef.current = history;
      setMessages(history);
      setHasLoadedHistory(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
    if (!hasLoadedHistory) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
    } catch {
      // El chat debe seguir funcionando aunque localStorage no esté disponible.
    }
  }, [hasLoadedHistory, messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    function getEyeOffset(target: Element | null, event: PointerEvent | MouseEvent) {
      const rect = target?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const strength = Math.min(1, distance / 160);

      return {
        x: (dx / distance) * 7 * strength,
        y: (dy / distance) * 4.5 * strength,
      };
    }

    function handlePointerMove(event: PointerEvent) {
      setEyeOffset(getEyeOffset(botRef.current, event));
      setPanelEyeOffset(getEyeOffset(panelBotRef.current, event));
    }

    function resetEyes() {
      setEyeOffset({ x: 0, y: 0 });
      setPanelEyeOffset({ x: 0, y: 0 });
    }

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("mouseleave", resetEyes);
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("mouseleave", resetEyes);
    };
  }, []);

  async function typeAssistantMessage(content: string) {
    const text = content || "Listo. Puedo ayudarte con otra duda de Orvenix.";
    setIsTyping(true);

    for (let index = 1; index <= text.length; index += 1) {
      const partial = text.slice(0, index);
      const updated = messagesRef.current.map((message, messageIndex) =>
        messageIndex === messagesRef.current.length - 1 ? { ...message, content: partial } : message
      );
      messagesRef.current = updated;
      setMessages(updated);

      const char = text[index - 1];
      const delay = char === "." || char === "\n" ? 28 : char === "," ? 22 : 12;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    setIsTyping(false);
  }

  async function sendMessage(rawText: string, visible = true) {
    const text = rawText.trim();
    if (!text || isBusy) return;

    if (visible) setIsOpen(true);
    setIsSending(true);

    const userMessage: ChatMessage = { role: "user", content: text };
    const assistantMessage: ChatMessage = { role: "assistant", content: "" };
    const nextMessages = [...messagesRef.current, userMessage, assistantMessage].slice(-MAX_HISTORY);

    setMessages(nextMessages);
    messagesRef.current = nextMessages;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => message.content)
            .map(({ role, content }) => ({ role, content }))
            .slice(-10),
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      let assistantText = "";
      await readAssistantResponse(response, (content) => {
        assistantText = content;
      });

      setIsSending(false);
      await typeAssistantMessage(assistantText);
    } catch {
      const updated = messagesRef.current.map((message, index) =>
        index === messagesRef.current.length - 1
          ? {
              ...message,
              error: true,
              content:
                "No pude conectar con el asistente en este momento. Puedes escribirnos desde /contacto/ y te atendemos directo.",
            }
          : message
      );
      messagesRef.current = updated;
      setMessages(updated);
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  }

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  });

  useEffect(() => {
    const bridge: OrvenixChatBridge = {
      __ready: true,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((open) => !open),
      internalQuery: async (prompt, visible = true) => {
        await sendMessageRef.current(prompt, visible);
      },
    };

    window.orvenixChat = bridge;
    return () => {
      if (window.orvenixChat === bridge) delete window.orvenixChat;
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input;
    setInput("");
    void sendMessage(text);
  }

  const eyeStyle = {
    "--orvenix-eye-x": `${eyeOffset.x}px`,
    "--orvenix-eye-y": `${eyeOffset.y}px`,
  } as CSSProperties;
  const panelEyeStyle = {
    "--orvenix-eye-x": `${panelEyeOffset.x}px`,
    "--orvenix-eye-y": `${panelEyeOffset.y}px`,
  } as CSSProperties;

  return (
    <div className="fixed bottom-[5.9rem] right-5 z-[90] font-sans max-sm:bottom-[5.65rem] max-sm:right-4">
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar chat"
          className="fixed inset-0 z-[91] cursor-default bg-slate-950/20"
          onClick={() => setIsOpen(false)}
        />
      )}

      <section
        aria-label="Chat de Orvenix AI"
        className={`fixed bottom-[12.2rem] right-5 z-[92] flex max-h-[min(680px,calc(100vh-13.6rem))] min-h-[520px] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[18px] border border-slate-400/20 bg-[#07111f] text-sky-50 shadow-2xl shadow-black/45 transition-all duration-200 max-sm:bottom-[11.7rem] max-sm:right-3 max-sm:min-h-[min(520px,calc(100vh-12.6rem))] max-sm:w-[calc(100vw-1.5rem)] ${
          isOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-3 scale-[0.98] opacity-0"
        }`}
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-400/15 bg-slate-950/45 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span ref={panelBotRef} className={`orvenix-bot-mini ${isBusy ? "orvenix-bot-talking" : ""}`} style={panelEyeStyle} aria-hidden="true">
              <span className="orvenix-bot-figure">
                <span className="orvenix-bot-headset-band" />
                <span className="orvenix-bot-ear orvenix-bot-ear-left" />
                <span className="orvenix-bot-ear orvenix-bot-ear-right" />
                <span className="orvenix-bot-head">
                  <span className="orvenix-bot-sheen" />
                  <span className="orvenix-bot-sparkle" />
                  <span className="orvenix-bot-eye orvenix-bot-eye-left">
                    <span />
                  </span>
                  <span className="orvenix-bot-eye orvenix-bot-eye-right">
                    <span />
                  </span>
                  <span className="orvenix-bot-mouth" />
                </span>
                <span className="orvenix-bot-mic-arm" />
              </span>
            </span>
            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-black uppercase tracking-[0.12em] text-cyan-300">Asistente Orvenix</p>
              <h2 className="text-base font-extrabold text-white">Resuelve dudas antes de cotizar</h2>
              <p className="mt-1 text-xs leading-snug text-slate-400">
                Actualizado con plataforma, planes, editor y demos del proyecto.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar chat"
            onClick={() => setIsOpen(false)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-400/20 bg-slate-900/80 text-slate-100 transition-colors hover:bg-slate-800"
          >
            <X size={17} />
          </button>
        </header>

        <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`w-fit max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.role === "user"
                  ? "self-end rounded-br-md bg-linear-to-br from-cyan-600 to-sky-800 text-white"
                  : message.error
                    ? "self-start rounded-bl-md border border-red-400/25 bg-red-950/50 text-red-100"
                    : "self-start rounded-bl-md border border-slate-400/15 bg-slate-900/90 text-slate-100"
              }`}
            >
              {message.content || "Pensando..."}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void sendMessage(suggestion)}
              className="rounded-full border border-cyan-300/20 bg-cyan-950/30 px-3 py-1.5 text-xs font-bold text-cyan-100 transition-colors hover:border-cyan-200/40 hover:bg-cyan-900/40"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-400/15 bg-slate-950/55 p-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            rows={2}
            disabled={isBusy}
            placeholder="Pregunta por precios, plataforma, tiempos..."
            className="min-w-0 flex-1 resize-none rounded-xl border border-slate-400/20 bg-slate-900/90 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-300/50 disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={isBusy || !input.trim()}
            className="grid w-11 shrink-0 place-items-center rounded-xl bg-cyan-300 text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            aria-label="Enviar mensaje"
          >
            <Send size={17} />
          </button>
        </form>
      </section>

      <button
        ref={botRef}
        type="button"
        style={eyeStyle}
        aria-label={isOpen ? "Cerrar chat de Orvenix AI" : "Abrir chat de Orvenix AI"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={`orvenix-bot-trigger group ${isOpen ? "orvenix-bot-trigger-open" : ""} ${isBusy ? "orvenix-bot-talking" : ""}`}
      >
        <span className="orvenix-bot-aura" aria-hidden="true" />
        {isSending && (
          <span className="orvenix-bot-thinking" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        )}
        <span className="orvenix-bot-figure" aria-hidden="true">
          <span className="orvenix-bot-headset-band" />
          <span className="orvenix-bot-ear orvenix-bot-ear-left" />
          <span className="orvenix-bot-ear orvenix-bot-ear-right" />
          <span className="orvenix-bot-head">
            <span className="orvenix-bot-sheen" />
            <span className="orvenix-bot-sparkle" />
            <span className="orvenix-bot-eye orvenix-bot-eye-left">
              <span />
            </span>
            <span className="orvenix-bot-eye orvenix-bot-eye-right">
              <span />
            </span>
            <span className="orvenix-bot-mouth" />
          </span>
          <span className="orvenix-bot-mic-arm" />
          <span className="orvenix-bot-label">Orvenix AI</span>
        </span>
        <span className={`orvenix-bot-notification ${isOpen || isBusy ? "orvenix-bot-notification-active" : ""}`} />
      </button>
    </div>
  );
}

declare global {
  interface Window {
    orvenixChat?: OrvenixChatBridge;
  }
}
