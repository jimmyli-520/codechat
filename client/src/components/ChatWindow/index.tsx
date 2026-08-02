import {
  ChevronRight,
  FileCode2,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  SlidersHorizontal,
  Square
} from "lucide-react";
import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
  lazy,
  Suspense,
  useMemo,
  useState
} from "react";
import type { Message } from "../../store/chatSlice";
import type { ModelOption } from "../../store/modelSlice";
import type { PersonaOption } from "../../store/modeSlice";
import type { LanguageOption } from "../../store/store";
import { ModeSwitcher } from "../ModeSwitcher";
import { ModelSelector } from "../ModelSelector";
import { formatPastedCode } from "./codePaste";

const MarkdownMessageContent = lazy(() => import("./MessageContent"));

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
  hasAvailableModel: boolean;
  input: string;
  isChatOpen: boolean;
  isLoading: boolean;
  isModelsLoading: boolean;
  isSettingsOpen: boolean;
  latestMessageRef: RefObject<HTMLDivElement | null>;
  messages: Message[];
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  modelOptions: ModelOption[];
  modelsError: string | null;
  selectedModel: string;
  selectedLanguage: LanguageOption["id"];
  selectedPersona: PersonaOption["id"];
  settingsMenuRef: RefObject<HTMLDivElement | null>;
  onCancel: () => void;
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onInputChange: (value: string) => void;
  onMessagesScroll: () => void;
  onRefreshModels: () => void;
  onSetChatOpen: (isOpen: boolean) => void;
  onSetSelectedModel: (model: string) => void;
  onSetSelectedPersona: (persona: PersonaOption["id"]) => void;
  onSetSettingsOpen: (isOpen: boolean | ((isOpen: boolean) => boolean)) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function MessageContent({ message }: { message: Message }) {
  if (message.role === "user" && !message.content.includes("```")) {
    return <p>{message.content}</p>;
  }

  return (
    <Suspense fallback={<p className="message-rendering">Formatting response…</p>}>
      <MarkdownMessageContent message={message} />
    </Suspense>
  );
}

export function ChatWindow({
  activeModel,
  activePersona,
  error,
  hasAvailableModel,
  input,
  isChatOpen,
  isLoading,
  isModelsLoading,
  isSettingsOpen,
  latestMessageRef,
  messages,
  messagesContainerRef,
  modelOptions,
  modelsError,
  onCancel,
  onComposerKeyDown,
  onInputChange,
  onMessagesScroll,
  onRefreshModels,
  onSetChatOpen,
  onSetSelectedModel,
  onSetSelectedPersona,
  onSetSettingsOpen,
  onSubmit,
  selectedLanguage,
  selectedModel,
  selectedPersona,
  settingsMenuRef
}: ChatWindowProps) {
  const [dismissedAutocompletePrefix, setDismissedAutocompletePrefix] = useState<string | null>(
    null
  );
  const autocompleteSuggestion = useMemo(() => {
    if (input.includes("\n")) {
      return null;
    }

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

  function handleAutocompleteKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
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

    onComposerKeyDown(event);
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const pastedText = event.clipboardData.getData("text/plain");
    const formattedText = formatPastedCode(pastedText, selectedLanguage);

    if (formattedText === pastedText.replace(/\r\n/g, "\n")) {
      return;
    }

    event.preventDefault();
    const textarea = event.currentTarget;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const nextInput = `${input.slice(0, selectionStart)}${formattedText}${input.slice(selectionEnd)}`;
    const nextCursorPosition = selectionStart + formattedText.length;

    onInputChange(nextInput);
    window.requestAnimationFrame(() => {
      textarea.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
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
                  error={modelsError}
                  isLoading={isModelsLoading}
                  models={modelOptions}
                  onChange={onSetSelectedModel}
                  onRefresh={onRefreshModels}
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

      <div
        className="messages"
        aria-live="polite"
        onScroll={onMessagesScroll}
        ref={messagesContainerRef}
      >
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <strong>Start with a coding question.</strong>
            <span>Use chat for general help, or add code in the editor and press CodeChat.</span>
          </div>
        ) : null}

        {messages.map((message) => (
          <article
            className={`message ${message.role}${
              message.role === "assistant" && message.status === "generating"
                ? " loading-message"
                : ""
            }`}
            key={message.id}
          >
            <span>{message.role === "user" ? "You" : "CodeChat"}</span>
            {message.content ? (
              <>
                <MessageContent message={message} />
                {message.editorContextLabel ? (
                  <div className="editor-context-chip">
                    <FileCode2 aria-hidden="true" size={14} />
                    <span>Editor code included</span>
                    <small>{message.editorContextLabel}</small>
                  </div>
                ) : null}
                {message.status === "stopped" ? (
                  <p className="message-status">Stopped</p>
                ) : message.status === "failed" ? (
                  <p className="message-status error-status">Generation failed</p>
                ) : null}
              </>
            ) : message.status === "generating" ? (
              <p className="generating-indicator">
                <span aria-hidden="true">
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                </span>
                <span>Generating…</span>
              </p>
            ) : message.status === "stopped" ? (
              <p className="message-status">Generation stopped.</p>
            ) : message.status === "failed" ? (
              <p className="message-status error-status">Generation failed.</p>
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
          <textarea
            aria-label="Message"
            className={autocompleteSuggestion ? "has-autocomplete" : undefined}
            disabled={isLoading}
            onChange={(event) => {
              setDismissedAutocompletePrefix(null);
              onInputChange(event.target.value);
            }}
            onKeyDown={handleAutocompleteKeyDown}
            onPaste={handlePaste}
            placeholder="Ask a coding question..."
            rows={input.includes("\n") ? 5 : 1}
            value={input}
          />
        </div>
        {isLoading ? (
          <button className="composer-action stop-button" onClick={onCancel} type="button">
            <Square size={15} />
            Stop
          </button>
        ) : (
          <button
            className="composer-action"
            disabled={!input.trim() || !hasAvailableModel}
            type="submit"
          >
            <Send size={16} />
            Send
          </button>
        )}
      </form>
    </div>
  );
}
