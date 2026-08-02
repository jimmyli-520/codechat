import {
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState
} from "react";
import {
  deleteConversation,
  fetchConversation,
  fetchConversations,
  fetchInstalledModels,
  sendChatMessage,
  startChatStream
} from "../services/api";
import {
  type ConversationSummary,
  type Message,
  type StreamEvent,
  formatErrorMessage,
  initialMessages,
  isVisibleMessage,
  toChatHistory
} from "./chatSlice";
import { canSubmitComposer, getComposerKeyAction } from "./composerKeyboard";
import { prepareChatMessage } from "./editorContext";
import {
  type ModelOption,
  reconcileSelectedModel
} from "./modelSlice";
import { type PersonaOption, personaOptions } from "./modeSlice";
import {
  getCodeForLanguageChange,
  starterCodeByLanguage,
  type SupportedLanguage
} from "./starterCode";
import { applyStreamEvent } from "./streamEvents";
import {
  isNearScrollBottom,
  streamFrameDelayMs,
  takeNextStreamFrame
} from "./streamPresentation";

export type LanguageOption = {
  id: SupportedLanguage;
  label: string;
};

export type Theme = "light" | "dark";

type ResizableColumn = "history" | "editor";

const collapsedColumnWidth = 52;
const resizeHandleWidth = 18;
const defaultHistoryColumnWidth = 292;
const defaultEditorColumnWidth = 430;
const maxHistoryColumnWidth = 420;
const maxEditorColumnWidth = 760;

export const languageOptions: LanguageOption[] = [
  {
    id: "javascript",
    label: "JavaScript"
  },
  {
    id: "typescript",
    label: "TypeScript"
  },
  {
    id: "python",
    label: "Python"
  },
  {
    id: "html",
    label: "HTML"
  },
  {
    id: "css",
    label: "CSS"
  }
];

export function useCodeChatStore() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [input, setInput] = useState("");
  const [code, setCode] = useState(starterCodeByLanguage.javascript);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption["id"]>("javascript");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [isModelsLoading, setIsModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<PersonaOption["id"]>("code-teacher");
  const [theme, setTheme] = useState<Theme>("light");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isWelcomeHeroRendered, setIsWelcomeHeroRendered] = useState(true);
  const [historyPanelWidth, setHistoryPanelWidth] = useState(defaultHistoryColumnWidth);
  const [editorPanelWidth, setEditorPanelWidth] = useState(defaultEditorColumnWidth);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workspaceRef = useRef<HTMLElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const latestMessageRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const shouldResetMessagesScrollRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamAssistantIdRef = useRef<string | null>(null);
  const streamBufferRef = useRef("");
  const streamFlushTimeoutRef = useRef<number | null>(null);
  const streamDrainResolversRef = useRef<Array<() => void>>([]);
  const activeModel = modelOptions.find((model) => model.id === selectedModel) ?? {
    id: "",
    label: isModelsLoading
      ? "Loading models…"
      : modelsError
        ? "Ollama unavailable"
        : "No local model",
    description: isModelsLoading
      ? "Checking Ollama"
      : modelsError
        ? "Refresh to try again"
        : "Install a model to chat"
  };
  const hasAvailableModel = Boolean(selectedModel) && modelOptions.some(
    (model) => model.id === selectedModel
  );
  const activePersona =
    personaOptions.find((persona) => persona.id === selectedPersona) ?? personaOptions[1];
  const showWelcomeHero = !isHistoryOpen && !isEditorOpen && !isChatOpen;
  const showWelcomeSlot = showWelcomeHero || isWelcomeHeroRendered;
  const historyColumnWidth = isHistoryOpen ? historyPanelWidth : collapsedColumnWidth;
  const editorColumnWidth = isEditorOpen ? editorPanelWidth : collapsedColumnWidth;
  const historyWidth = `${historyColumnWidth}px`;
  const editorWidth = `${editorColumnWidth}px`;
  const chatWidth = isChatOpen
    ? `calc(100% - ${historyWidth} - ${editorWidth} - ${resizeHandleWidth * 2}px)`
    : `${collapsedColumnWidth}px`;
  const welcomeWidth = showWelcomeHero
    ? `calc(100% - ${collapsedColumnWidth * 3 + resizeHandleWidth * 2}px)`
    : "0px";
  const columnStyle = (width: string) =>
    ({
      "--column-width": width
    }) as CSSProperties;

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    if (shouldResetMessagesScrollRef.current) {
      container.scrollTop = 0;
      shouldResetMessagesScrollRef.current = false;
      return;
    }

    if (!shouldStickToBottomRef.current) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [messages, isLoading]);

  useEffect(() => {
    void loadConversations();
    void refreshModels();
  }, []);

  useEffect(() => {
    if (showWelcomeHero) {
      setIsWelcomeHeroRendered(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsWelcomeHeroRendered(false);
    }, 360);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showWelcomeHero]);

  useEffect(() => {
    if (!isSettingsOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        settingsMenuRef.current &&
        event.target instanceof Node &&
        !settingsMenuRef.current.contains(event.target)
      ) {
        setIsSettingsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isSettingsOpen]);

  async function loadConversations() {
    try {
      setConversations(await fetchConversations());
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load conversations.";

      setError(formatErrorMessage(message));
    }
  }

  async function refreshModels() {
    setIsModelsLoading(true);
    setModelsError(null);

    try {
      const installedModels = await fetchInstalledModels();
      setModelOptions(installedModels);
      setSelectedModel((currentModel) =>
        reconcileSelectedModel({
          models: installedModels,
          selectedModel: currentModel
        })
      );
    } catch (caughtError) {
      setModelOptions([]);
      setSelectedModel("");
      setModelsError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load installed Ollama models."
      );
    } finally {
      setIsModelsLoading(false);
    }
  }

  function formatTimestamp(timestamp: string) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(timestamp));
  }

  function handleNewChat() {
    abortControllerRef.current?.abort();
    shouldStickToBottomRef.current = false;
    shouldResetMessagesScrollRef.current = true;
    setIsHistoryOpen(true);
    setIsChatOpen(true);
    setConversationId(null);
    setMessages(initialMessages);
    setInput("");
    setError(null);
    setIsLoading(false);
  }

  async function handleSelectConversation(id: string) {
    if (isLoading) {
      abortControllerRef.current?.abort();
    }

    setIsHistoryOpen(true);
    setIsChatOpen(true);
    setIsConversationLoading(true);
    setError(null);

    try {
      const conversation = await fetchConversation(id);
      const visibleMessages = conversation.messages
        .filter(isVisibleMessage)
        .map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content
        }));

      shouldStickToBottomRef.current = false;
      shouldResetMessagesScrollRef.current = true;
      setConversationId(conversation.id);
      setMessages(visibleMessages.length > 0 ? visibleMessages : initialMessages);
      setSelectedModel(
        reconcileSelectedModel({
          models: modelOptions,
          selectedModel: conversation.model
        })
      );
      setSelectedPersona(conversation.persona);
      setInput("");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load conversation.";

      setError(formatErrorMessage(message));
    } finally {
      setIsConversationLoading(false);
    }
  }

  async function handleDeleteConversation(id: string) {
    if (isLoading) {
      return false;
    }

    setError(null);

    try {
      await deleteConversation(id);

      setConversations((currentConversations) =>
        currentConversations.filter((conversation) => conversation.id !== id)
      );

      if (conversationId === id) {
        handleNewChat();
      }

      return true;
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete conversation.";

      setError(formatErrorMessage(message));
      return false;
    }
  }

  async function sendFallbackMessage(
    message: string,
    assistantMessageId: string,
    activeConversationId: string | null,
    historyMessages: Message[]
  ) {
    const data = await sendChatMessage({
      conversationId: activeConversationId,
      message,
      messages: toChatHistory(historyMessages),
      model: selectedModel,
      persona: selectedPersona
    });
    const assistantContent = data.message?.content?.trim();

    if (!assistantContent) {
      throw new Error("CodeChat returned an empty response.");
    }

    if (data.conversationId) {
      setConversationId(data.conversationId);
    }

    setMessages((currentMessages) =>
      currentMessages.map((currentMessage) =>
        currentMessage.id === assistantMessageId
          ? {
              ...currentMessage,
              content: assistantContent,
              status: "complete"
            }
          : currentMessage
      )
    );
    await loadConversations();
  }

  function appendAssistantContent(assistantMessageId: string, content: string) {
    setMessages((currentMessages) =>
      currentMessages.map((currentMessage) =>
        currentMessage.id === assistantMessageId
          ? {
              ...currentMessage,
              content: currentMessage.content + content,
              status: "streaming"
            }
          : currentMessage
      )
    );
  }

  function resolveStreamDrain() {
    if (streamBufferRef.current || streamFlushTimeoutRef.current !== null) {
      return;
    }

    const resolvers = streamDrainResolversRef.current.splice(0);
    resolvers.forEach((resolve) => resolve());
  }

  function flushStreamFrame() {
    streamFlushTimeoutRef.current = null;
    const assistantMessageId = streamAssistantIdRef.current;

    if (!assistantMessageId || !streamBufferRef.current) {
      resolveStreamDrain();
      return;
    }

    const frame = takeNextStreamFrame(streamBufferRef.current);
    streamBufferRef.current = frame.remaining;
    appendAssistantContent(assistantMessageId, frame.content);

    if (streamBufferRef.current) {
      streamFlushTimeoutRef.current = window.setTimeout(flushStreamFrame, streamFrameDelayMs);
    }

    resolveStreamDrain();
  }

  function queueAssistantContent(assistantMessageId: string, content: string) {
    if (streamAssistantIdRef.current !== assistantMessageId) {
      return;
    }

    streamBufferRef.current += content;

    if (streamFlushTimeoutRef.current === null) {
      streamFlushTimeoutRef.current = window.setTimeout(flushStreamFrame, streamFrameDelayMs);
    }
  }

  function waitForStreamDrain(assistantMessageId: string) {
    if (streamAssistantIdRef.current !== assistantMessageId) {
      return Promise.resolve();
    }

    if (!streamBufferRef.current && streamFlushTimeoutRef.current === null) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      streamDrainResolversRef.current.push(resolve);
    });
  }

  function flushStreamImmediately(assistantMessageId: string) {
    if (streamAssistantIdRef.current !== assistantMessageId) {
      return;
    }

    if (streamFlushTimeoutRef.current !== null) {
      window.clearTimeout(streamFlushTimeoutRef.current);
      streamFlushTimeoutRef.current = null;
    }

    const content = streamBufferRef.current;
    streamBufferRef.current = "";

    if (content) {
      appendAssistantContent(assistantMessageId, content);
    }

    resolveStreamDrain();
  }

  function startStreamPresentation(assistantMessageId: string) {
    if (streamFlushTimeoutRef.current !== null) {
      window.clearTimeout(streamFlushTimeoutRef.current);
      streamFlushTimeoutRef.current = null;
    }

    streamBufferRef.current = "";
    streamDrainResolversRef.current.splice(0).forEach((resolve) => resolve());
    streamAssistantIdRef.current = assistantMessageId;
  }

  function setAssistantStatus(assistantMessageId: string, status: Message["status"]) {
    setMessages((currentMessages) =>
      currentMessages.map((currentMessage) =>
        currentMessage.id === assistantMessageId
          ? { ...currentMessage, status }
          : currentMessage
      )
    );
  }

  async function handleStreamEvent(event: StreamEvent, assistantMessageId: string) {
    await applyStreamEvent(event, {
      appendAssistantContent: (content) =>
        queueAssistantContent(assistantMessageId, content),
      refreshConversations: loadConversations,
      setConversationId
    });
  }

  function handleCancel() {
    abortControllerRef.current?.abort();
  }

  function handleMessagesScroll() {
    const container = messagesContainerRef.current;

    if (container) {
      shouldStickToBottomRef.current = isNearScrollBottom(container);
    }
  }

  function clampWidth(width: number, minWidth: number, maxWidth: number) {
    return Math.min(Math.max(width, minWidth), maxWidth);
  }

  function getMaxResizeWidth(column: ResizableColumn) {
    const workspaceWidth = workspaceRef.current?.getBoundingClientRect().width ?? 1480;
    const otherColumnWidth = column === "history" ? editorColumnWidth : historyColumnWidth;
    const minWidth =
      column === "history" ? defaultHistoryColumnWidth : defaultEditorColumnWidth;
    const reservedWidth = otherColumnWidth + collapsedColumnWidth + resizeHandleWidth * 2;
    const availableWidth = Math.max(minWidth, workspaceWidth - reservedWidth);

    return Math.min(
      column === "history" ? maxHistoryColumnWidth : maxEditorColumnWidth,
      availableWidth
    );
  }

  function handleResizeStart(
    event: ReactPointerEvent<HTMLButtonElement>,
    column: ResizableColumn
  ) {
    if ((column === "history" && !isHistoryOpen) || (column === "editor" && !isEditorOpen)) {
      return;
    }

    event.preventDefault();

    const startX = event.clientX;
    const startWidth = column === "history" ? historyPanelWidth : editorPanelWidth;
    const minWidth =
      column === "history" ? defaultHistoryColumnWidth : defaultEditorColumnWidth;
    const maxWidth = getMaxResizeWidth(column);
    let nextAnimationFrame: number | null = null;
    let latestWidth = startWidth;

    function applyLatestWidth() {
      if (column === "history") {
        setHistoryPanelWidth(latestWidth);
      } else {
        setEditorPanelWidth(latestWidth);
      }

      nextAnimationFrame = null;
    }

    document.body.classList.add("is-resizing-column");

    function handlePointerMove(pointerEvent: PointerEvent) {
      latestWidth = clampWidth(
        startWidth + pointerEvent.clientX - startX,
        minWidth,
        maxWidth
      );

      if (nextAnimationFrame === null) {
        nextAnimationFrame = window.requestAnimationFrame(applyLatestWidth);
      }
    }

    function handlePointerUp() {
      if (nextAnimationFrame !== null) {
        window.cancelAnimationFrame(nextAnimationFrame);
      }

      applyLatestWidth();
      document.body.classList.remove("is-resizing-column");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  async function sendMessage(rawMessage: string) {
    const trimmedMessage = rawMessage.trim();
    const activeConversationId = conversationId;

    if (!trimmedMessage || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedMessage
    };
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      status: "generating"
    };
    const historyMessages = [...messages, userMessage];
    const abortController = new AbortController();

    startStreamPresentation(assistantMessageId);

    shouldStickToBottomRef.current = true;
    setIsHistoryOpen(true);
    setIsChatOpen(true);
    abortControllerRef.current = abortController;
    setMessages((currentMessages) => [...currentMessages, userMessage, assistantMessage]);
    setError(null);
    setIsLoading(true);

    try {
      const response = await startChatStream({
        conversationId: activeConversationId,
        message: trimmedMessage,
        messages: toChatHistory(historyMessages),
        model: selectedModel,
        persona: selectedPersona,
        signal: abortController.signal
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "CodeChat could not start streaming.");
      }

      if (!response.body) {
        await sendFallbackMessage(
          trimmedMessage,
          assistantMessageId,
          activeConversationId,
          historyMessages
        );
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const streamEvent of events) {
          const dataLine = streamEvent
            .split("\n")
            .find((line) => line.startsWith("data: "));

          if (!dataLine) {
            continue;
          }

          const data = JSON.parse(dataLine.slice(6)) as StreamEvent;

          await handleStreamEvent(data, assistantMessageId);

          if (data.type === "done") {
            await waitForStreamDrain(assistantMessageId);
            setAssistantStatus(assistantMessageId, "complete");
            await loadConversations();
            return;
          }
        }
      }

      await waitForStreamDrain(assistantMessageId);
      setAssistantStatus(assistantMessageId, "complete");
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
        flushStreamImmediately(assistantMessageId);
        setAssistantStatus(assistantMessageId, "stopped");
        await loadConversations();
        return;
      }

      flushStreamImmediately(assistantMessageId);
      setAssistantStatus(assistantMessageId, "failed");

      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while contacting CodeChat.";

      setError(formatErrorMessage(message));
    } finally {
      if (streamAssistantIdRef.current === assistantMessageId) {
        streamAssistantIdRef.current = null;
      }

      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedInput = input.trim();

    if (!trimmedInput || isLoading) {
      return;
    }

    if (!hasAvailableModel) {
      setError("Install an Ollama model and refresh the model list before sending a message.");
      return;
    }

    const languageLabel =
      languageOptions.find((language) => language.id === selectedLanguage)?.label ??
      selectedLanguage;
    const message = prepareChatMessage({
      code,
      language: selectedLanguage,
      languageLabel,
      persona: selectedPersona,
      question: trimmedInput
    });

    setInput("");
    await sendMessage(message);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const action = getComposerKeyAction(event);

    if (!canSubmitComposer({ action, input, isLoading })) {
      return;
    }

    if (!hasAvailableModel) {
      event.preventDefault();
      setError("Install an Ollama model and refresh the model list before sending a message.");
      return;
    }

    event.preventDefault();
    const trimmedInput = input.trim();
    const languageLabel =
      languageOptions.find((language) => language.id === selectedLanguage)?.label ??
      selectedLanguage;
    const message = prepareChatMessage({
      code,
      language: selectedLanguage,
      languageLabel,
      persona: selectedPersona,
      question: trimmedInput
    });

    setInput("");
    void sendMessage(message);
  }

  function handleLanguageChange(nextLanguage: LanguageOption["id"]) {
    setCode((currentCode) =>
      getCodeForLanguageChange({
        code: currentCode,
        currentLanguage: selectedLanguage,
        nextLanguage
      })
    );
    setSelectedLanguage(nextLanguage);
  }

  async function handleCodeChat() {
    const trimmedQuestion = input.trim();
    const trimmedCode = code.trim();

    if ((!trimmedQuestion && !trimmedCode) || isLoading) {
      return;
    }

    if (!hasAvailableModel) {
      setError("Install an Ollama model and refresh the model list before sending a message.");
      return;
    }

    const languageLabel =
      languageOptions.find((language) => language.id === selectedLanguage)?.label ??
      selectedLanguage;
    const message = prepareChatMessage({
      code: trimmedCode,
      forceEditorContext: true,
      language: selectedLanguage,
      languageLabel,
      persona: selectedPersona,
      question: trimmedQuestion
    });

    setInput("");
    await sendMessage(message);
  }

  return {
    activeModel,
    activePersona,
    chatWidth,
    code,
    columnStyle,
    conversationId,
    conversations,
    editorWidth,
    error,
    formatTimestamp,
    handleCancel,
    handleCodeChat,
    handleComposerKeyDown,
    handleDeleteConversation,
    handleLanguageChange,
    handleMessagesScroll,
    handleNewChat,
    handleResizeStart,
    handleSelectConversation,
    handleSubmit,
    hasAvailableModel,
    historyWidth,
    input,
    isChatOpen,
    isConversationLoading,
    isEditorOpen,
    isHistoryOpen,
    isLoading,
    isModelsLoading,
    isSettingsOpen,
    latestMessageRef,
    messages,
    messagesContainerRef,
    modelOptions,
    modelsError,
    refreshModels,
    selectedLanguage,
    selectedModel,
    selectedPersona,
    setCode,
    setInput,
    setIsChatOpen,
    setIsEditorOpen,
    setIsHistoryOpen,
    setIsSettingsOpen,
    setSelectedModel,
    setSelectedPersona,
    setTheme,
    settingsMenuRef,
    showWelcomeHero,
    showWelcomeSlot,
    theme,
    welcomeWidth,
    workspaceRef
  };
}
