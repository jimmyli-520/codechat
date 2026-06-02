import Editor from "@monaco-editor/react";
import { ChevronRight, PanelLeftClose, PanelLeftOpen, Wand2 } from "lucide-react";
import { languageOptions, type LanguageOption, type Theme } from "../../store/store";

type CodeEditorProps = {
  code: string;
  input: string;
  isEditorOpen: boolean;
  isLoading: boolean;
  selectedLanguage: LanguageOption["id"];
  theme: Theme;
  onCodeChange: (code: string) => void;
  onCodeChat: () => void;
  onLanguageChange: (language: LanguageOption["id"]) => void;
  onSetEditorOpen: (isOpen: boolean) => void;
};

export function CodeEditor({
  code,
  input,
  isEditorOpen,
  isLoading,
  onCodeChange,
  onCodeChat,
  onLanguageChange,
  onSetEditorOpen,
  selectedLanguage,
  theme
}: CodeEditorProps) {
  if (!isEditorOpen) {
    return (
      <button
        aria-label="Expand editor"
        className="editor-rail"
        onClick={() => onSetEditorOpen(true)}
        type="button"
      >
        <PanelLeftOpen size={18} />
        <span>Editor</span>
        <ChevronRight size={16} />
      </button>
    );
  }

  return (
    <div className="editor-panel">
      <header className="editor-header">
        <div>
          <p className="active-model-label">Workspace</p>
          <h2>Editor</h2>
        </div>

        <div className="editor-actions">
          <label className="chat-control language-control">
            <span>Language</span>
            <select
              disabled={isLoading}
              onChange={(event) => onLanguageChange(event.target.value as LanguageOption["id"])}
              value={selectedLanguage}
            >
              {languageOptions.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>
          <button
            aria-label="Collapse editor"
            className="icon-button"
            onClick={() => onSetEditorOpen(false)}
            type="button"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>
      </header>

      <div className="editor-frame">
        <Editor
          height="100%"
          language={selectedLanguage}
          onChange={(value) => onCodeChange(value ?? "")}
          options={{
            fontSize: 14,
            minimap: {
              enabled: false
            },
            scrollBeyondLastLine: false,
            wordWrap: "on"
          }}
          theme={theme === "dark" ? "vs-dark" : "light"}
          value={code}
        />
      </div>

      <button
        className="code-chat-button"
        disabled={isLoading || (!input.trim() && !code.trim())}
        onClick={onCodeChat}
        type="button"
      >
        <Wand2 size={17} />
        CodeChat
      </button>
    </div>
  );
}
