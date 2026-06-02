import { Moon, Sun } from "lucide-react";
import { ChatWindow } from "./components/ChatWindow";
import { CodeEditor } from "./components/CodeEditor";
import { Sidebar } from "./components/Sidebar";
import { useCodeChatStore } from "./store/store";

export function App() {
  const store = useCodeChatStore();

  return (
    <main className="app-shell" data-theme={store.theme}>
      <header className={`global-header${store.showWelcomeHero ? " welcome-header" : ""}`}>
        <div aria-hidden="true" />
        <div className="brand-mark" aria-hidden={store.showWelcomeHero}>
          CODECHAT
        </div>
        <button
          aria-label={`Switch to ${store.theme === "light" ? "dark" : "light"} mode`}
          aria-pressed={store.theme === "dark"}
          className="theme-switch"
          onClick={() =>
            store.setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"))
          }
          type="button"
        >
          <span className="theme-switch-thumb">
            {store.theme === "light" ? <Sun size={14} /> : <Moon size={14} />}
          </span>
        </button>
      </header>

      <section
        className={`workspace${store.showWelcomeHero ? " welcome-active" : " welcome-exiting"}`}
        ref={store.workspaceRef}
      >
        <div
          className={`workspace-column history-column${
            store.isHistoryOpen ? " is-open" : " is-collapsed"
          }`}
          style={store.columnStyle(store.historyWidth)}
        >
          <Sidebar
            conversationId={store.conversationId}
            conversations={store.conversations}
            formatTimestamp={store.formatTimestamp}
            isConversationLoading={store.isConversationLoading}
            isHistoryOpen={store.isHistoryOpen}
            isLoading={store.isLoading}
            onDeleteConversation={(id) => void store.handleDeleteConversation(id)}
            onNewChat={store.handleNewChat}
            onSelectConversation={(id) => void store.handleSelectConversation(id)}
            onSetHistoryOpen={store.setIsHistoryOpen}
          />
        </div>

        <button
          aria-disabled={!store.isHistoryOpen}
          aria-label="Resize history column"
          className="resize-handle"
          onPointerDown={(event) => store.handleResizeStart(event, "history")}
          type="button"
        />

        <div
          className={`workspace-column editor-column${
            store.isEditorOpen ? " is-open" : " is-collapsed"
          }`}
          style={store.columnStyle(store.editorWidth)}
        >
          <CodeEditor
            code={store.code}
            input={store.input}
            isEditorOpen={store.isEditorOpen}
            isLoading={store.isLoading}
            onCodeChange={store.setCode}
            onCodeChat={() => void store.handleCodeChat()}
            onLanguageChange={store.setSelectedLanguage}
            onSetEditorOpen={store.setIsEditorOpen}
            selectedLanguage={store.selectedLanguage}
            theme={store.theme}
          />
        </div>

        <button
          aria-disabled={!store.isEditorOpen}
          aria-label="Resize editor column"
          className="resize-handle"
          onPointerDown={(event) => store.handleResizeStart(event, "editor")}
          type="button"
        />

        <div
          className={`workspace-column chat-column${
            store.isChatOpen ? " is-open" : " is-collapsed"
          }`}
          style={store.columnStyle(store.chatWidth)}
        >
          <ChatWindow
            activeModel={store.activeModel}
            activePersona={store.activePersona}
            error={store.error}
            input={store.input}
            isChatOpen={store.isChatOpen}
            isLoading={store.isLoading}
            isSettingsOpen={store.isSettingsOpen}
            latestMessageRef={store.latestMessageRef}
            messages={store.messages}
            messagesContainerRef={store.messagesContainerRef}
            onCancel={store.handleCancel}
            onComposerKeyDown={store.handleComposerKeyDown}
            onInputChange={store.setInput}
            onSetChatOpen={store.setIsChatOpen}
            onSetSelectedModel={store.setSelectedModel}
            onSetSelectedPersona={store.setSelectedPersona}
            onSetSettingsOpen={store.setIsSettingsOpen}
            onSubmit={store.handleSubmit}
            selectedModel={store.selectedModel}
            selectedPersona={store.selectedPersona}
            settingsMenuRef={store.settingsMenuRef}
          />
        </div>

        <div
          className={`workspace-column welcome-column${
            store.showWelcomeHero ? " is-open" : " is-collapsed"
          }`}
          style={store.columnStyle(store.welcomeWidth)}
        >
          {store.showWelcomeSlot ? (
            <section
              className={`welcome-hero${store.showWelcomeHero ? "" : " welcome-hero-exit"}`}
              aria-label="CodeChat welcome"
            >
              <h1>CodeChat</h1>
              <p>CodeChat. Local intelligence, built for better coding.</p>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
