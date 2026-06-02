import {
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  SlidersHorizontal,
  Square
} from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useMemo,
  useState
} from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";
import type { Message } from "../../store/chatSlice";
import type { ModelOption } from "../../store/modelSlice";
import type { PersonaOption } from "../../store/modeSlice";
import { ModeSwitcher } from "../ModeSwitcher";
import { ModelSelector } from "../ModelSelector";

const autocompleteWords = [
  "suggestion",
  "suggest",
  "explain",
  "explanation",
  "function",
  "component",
  "TypeScript",
  "JavaScript",
  "Python",
  "error",
  "refactor",
  "optimize",
  "improve",
  "convert",
  "generate",
  "variable",
  "array",
  "object",
  "class",
  "async",
  "await",
  "promise",
  "endpoint",
  "database"
];

type ChatWindowProps = {
  activeModel: ModelOption;
  activePersona: PersonaOption;
  error: string | null;
  input: string;
  isChatOpen: boolean;
  isLoading: boolean;
  isSettingsOpen: boolean;
  latestMessageRef: RefObject<HTMLDivElement | null>;
  messages: Message[];
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  selectedModel: string;
  selectedPersona: PersonaOption["id"];
  settingsMenuRef: RefObject<HTMLDivElement | null>;
  onCancel: () => void;
  onComposerKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onInputChange: (value: string) => void;
  onSetChatOpen: (isOpen: boolean) => void;
  onSetSelectedModel: (model: string) => void;
  onSetSelectedPersona: (persona: PersonaOption["id"]) => void;
  onSetSettingsOpen: (isOpen: boolean | ((isOpen: boolean) => boolean)) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function CopyableCodeBlock({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");
  const language = className?.replace("hljs language-", "").replace("language-", "") ?? "code";

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span>{language}</span>
        <button onClick={() => void handleCopy()} type="button">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

function MessageContent({ message }: { message: Message }) {
  if (message.role === "user") {
    return <p>{message.content}</p>;
  }

  return (
    <div className="markdown-content">
      <ReactMarkdown
        components={{
          code({ children, className }) {
            return className ? (
              <CopyableCodeBlock className={className}>{children}</CopyableCodeBlock>
            ) : (
              <code>{children}</code>
            );
          }
        }}
        rehypePlugins={[rehypeHighlight]}
        remarkPlugins={[remarkGfm]}
      >
        {message.content}
      </ReactMarkdown>
    </div>
  );
}

export function ChatWindow({
  activeModel,
  activePersona,
  error,
  input,
  isChatOpen,
  isLoading,
  isSettingsOpen,
  latestMessageRef,
  messages,
  messagesContainerRef,
  onCancel,
  onComposerKeyDown,
  onInputChange,
  onSetChatOpen,
  onSetSelectedModel,
  onSetSelectedPersona,
  onSetSettingsOpen,
  onSubmit,
  selectedModel,
  selectedPersona,
  settingsMenuRef
}: ChatWindowProps) {
  const [dismissedAutocompletePrefix, setDismissedAutocompletePrefix] = useState<string | null>(
    null
  );
  const autocompleteSuggestion = useMemo(() => {
    const activeWordMatch = input.match(/[A-Za-z]+$/);

    if (!activeWordMatch) {
      return null;
    }

    const prefix = activeWordMatch[0];

    if (dismissedAutocompletePrefix === prefix) {
      return null;
    }

    const word = autocompleteWords.find(
      (autocompleteWord) =>
        autocompleteWord.toLowerCase().startsWith(prefix.toLowerCase()) &&
        autocompleteWord.toLowerCase() !== prefix.toLowerCase()
    );

    if (!word) {
      return null;
    }

    return {
      completedInput: `${input.slice(0, activeWordMatch.index)}${word}`,
      prefix,
      remainder: word.slice(prefix.length)
    };
  }, [dismissedAutocompletePrefix, input]);

  function acceptAutocompleteSuggestion() {
    if (!autocompleteSuggestion) {
      return;
    }

    onInputChange(autocompleteSuggestion.completedInput);
    setDismissedAutocompletePrefix(null);
  }

  function handleAutocompleteKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!autocompleteSuggestion) {
      onComposerKeyDown(event);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setDismissedAutocompletePrefix(autocompleteSuggestion.prefix);
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      acceptAutocompleteSuggestion();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      acceptAutocompleteSuggestion();
      return;
    }

    onComposerKeyDown(event);
  }

  if (!isChatOpen) {
    return (
      <button
        aria-label="Expand CodeChat"
        className="chat-rail"
        onClick={() => onSetChatOpen(true)}
        type="button"
      >
        <PanelLeftOpen size={18} />
        <span>CODECHAT</span>
        <ChevronRight size={16} />
      </button>
    );
  }

  return (
    <div className="chat-panel" aria-label="CodeChat chat">
      <header className="chat-header">
        <div>
          <p className="active-model-label">Active model</p>
          <p className="active-model">
            {activeModel.label}
            <span>{activeModel.description}</span>
          </p>
        </div>

        <div className="chat-actions">
          <div className="settings-menu" ref={settingsMenuRef}>
            <button
              aria-expanded={isSettingsOpen}
              aria-label="Open model and mode selector"
              className="icon-button"
              onClick={() => onSetSettingsOpen((isOpen) => !isOpen)}
              type="button"
            >
              <SlidersHorizontal size={18} />
            </button>

            {isSettingsOpen ? (
              <div className="settings-popover">
                <ModeSwitcher
                  disabled={isLoading}
                  onChange={onSetSelectedPersona}
                  selectedPersona={selectedPersona}
                />

                <ModelSelector
                  disabled={isLoading}
                  onChange={onSetSelectedModel}
                  selectedModel={selectedModel}
                />

                <p className="active-persona">Mode: {activePersona.label}</p>
              </div>
            ) : null}
          </div>

          <button
            aria-label="Collapse CodeChat"
            className="icon-button"
            onClick={() => {
              onSetSettingsOpen(false);
              onSetChatOpen(false);
            }}
            type="button"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>
      </header>

      <div className="messages" aria-live="polite" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <strong>Start with a coding question.</strong>
            <span>Use chat for general help, or add code in the editor and press CodeChat.</span>
          </div>
        ) : null}

        {messages.map((message) => (
          <article
            className={`message ${message.role}${
              isLoading && message.role === "assistant" && !message.content
                ? " loading-message"
                : ""
            }`}
            key={message.id}
          >
            <span>{message.role === "user" ? "You" : "CodeChat"}</span>
            {message.content ? (
              <MessageContent message={message} />
            ) : isLoading && message.role === "assistant" ? (
              <p>
                <span className="loading-dot" />
                <span className="loading-dot" />
                <span className="loading-dot" />
              </p>
            ) : (
              <p>No response.</p>
            )}
          </article>
        ))}

        <div ref={latestMessageRef} />
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      <form className="composer" onSubmit={onSubmit}>
        <div className="composer-input-shell">
          {autocompleteSuggestion ? (
            <div aria-hidden="true" className="autocomplete-preview">
              <span className="autocomplete-preview-text">{input}</span>
              <span className="autocomplete-preview-remainder">
                {autocompleteSuggestion.remainder}
              </span>
            </div>
          ) : null}
          <input
            aria-label="Message"
            className={autocompleteSuggestion ? "has-autocomplete" : undefined}
            disabled={isLoading}
            onChange={(event) => {
              setDismissedAutocompletePrefix(null);
              onInputChange(event.target.value);
            }}
            onKeyDown={handleAutocompleteKeyDown}
            placeholder="Ask a coding question... Ctrl+Enter to send"
            value={input}
          />
        </div>
        {isLoading ? (
          <button className="composer-action stop-button" onClick={onCancel} type="button">
            <Square size={15} />
            Stop
          </button>
        ) : (
          <button className="composer-action" disabled={!input.trim()} type="submit">
            <Send size={16} />
            Send
          </button>
        )}
      </form>
    </div>
  );
}
