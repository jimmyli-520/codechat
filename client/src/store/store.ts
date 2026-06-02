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
import { modelOptions } from "./modelSlice";
import { type PersonaOption, personaOptions } from "./modeSlice";

export type LanguageOption = {
  id: "javascript" | "typescript" | "python" | "html" | "css";
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

const starterCode = `function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("CodeChat"));`;

export function useCodeChatStore() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [input, setInput] = useState("");
  const [code, setCode] = useState(starterCode);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption["id"]>("javascript");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("llama3.2:3b");
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeModel = modelOptions.find((model) => model.id === selectedModel) ?? modelOptions[3];
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
    if (shouldStickToBottomRef.current) {
      latestMessageRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }

    shouldStickToBottomRef.current = true;
  }, [messages, isLoading]);

  useEffect(() => {
    void loadConversations();
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

  function formatTimestamp(timestamp: string) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(timestamp));
  }

  function handleNewChat() {
    abortControllerRef.current?.abort();
    shouldStickToBottomRef.current = false;
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
      setConversationId(conversation.id);
      setMessages(visibleMessages.length > 0 ? visibleMessages : initialMessages);
      setSelectedModel(conversation.model);
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
      return;
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
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete conversation.";

      setError(formatErrorMessage(message));
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
              content: assistantContent
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
              content: currentMessage.content + content
            }
          : currentMessage
      )
    );
  }

  function handleStreamEvent(event: StreamEvent, assistantMessageId: string) {
    if (event.type === "conversation") {
      setConversationId(event.conversationId);
      return;
    }

    if (event.type === "chunk") {
      appendAssistantContent(assistantMessageId, event.content);
      return;
    }

    if (event.type === "error") {
      throw new Error(event.error);
    }
  }

  function handleCancel() {
    abortControllerRef.current?.abort();
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
      content: ""
    };
    const historyMessages = [...messages, userMessage];
    const abortController = new AbortController();

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

          handleStreamEvent(data, assistantMessageId);

          if (data.type === "done") {
            await loadConversations();
            return;
          }
        }
      }
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
        await loadConversations();
        return;
      }

      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while contacting CodeChat.";

      setError(formatErrorMessage(message));
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedInput = input.trim();

    if (!trimmedInput || isLoading) {
      return;
    }

    setInput("");
    await sendMessage(trimmedInput);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      const trimmedInput = input.trim();

      if (!trimmedInput || isLoading) {
        return;
      }

      setInput("");
      void sendMessage(trimmedInput);
    }
  }

  async function handleCodeChat() {
    const trimmedQuestion = input.trim();
    const trimmedCode = code.trim();

    if ((!trimmedQuestion && !trimmedCode) || isLoading) {
      return;
    }

    const languageLabel =
      languageOptions.find((language) => language.id === selectedLanguage)?.label ??
      selectedLanguage;
    const message = [
      trimmedQuestion || "Please review this code.",
      "",
      `Language: ${languageLabel}`,
      "",
      "Code:",
      `\`\`\`${selectedLanguage}`,
      trimmedCode || "(No code provided.)",
      "```"
    ].join("\n");

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
    handleNewChat,
    handleResizeStart,
    handleSelectConversation,
    handleSubmit,
    historyWidth,
    input,
    isChatOpen,
    isConversationLoading,
    isEditorOpen,
    isHistoryOpen,
    isLoading,
    isSettingsOpen,
    latestMessageRef,
    messages,
    messagesContainerRef,
    selectedLanguage,
    selectedModel,
    selectedPersona,
    setCode,
    setInput,
    setIsChatOpen,
    setIsEditorOpen,
    setIsHistoryOpen,
    setIsSettingsOpen,
    setSelectedLanguage,
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
