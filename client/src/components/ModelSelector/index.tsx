import { RefreshCw } from "lucide-react";
import type { ModelOption } from "../../store/modelSlice";

type ModelSelectorProps = {
  disabled: boolean;
  error: string | null;
  isLoading: boolean;
  models: ModelOption[];
  selectedModel: string;
  onChange: (model: string) => void;
  onRefresh: () => void;
};

export function ModelSelector({
  disabled,
  error,
  isLoading,
  models,
  onChange,
  onRefresh,
  selectedModel
}: ModelSelectorProps) {
  return (
    <div className="model-selector">
      <div className="model-selector-header">
        <span>Model</span>
        <button
          aria-label="Refresh installed Ollama models"
          className="model-refresh-button"
          disabled={disabled || isLoading}
          onClick={onRefresh}
          type="button"
        >
          <RefreshCw className={isLoading ? "is-spinning" : undefined} size={14} />
          Refresh
        </button>
      </div>
      <label className="chat-control">
        <span className="sr-only">Installed Ollama model</span>
        <select
          disabled={disabled || isLoading || models.length === 0}
          onChange={(event) => onChange(event.target.value)}
          value={selectedModel}
        >
          {models.length === 0 ? (
            <option value="">{isLoading ? "Loading local models…" : "No local models available"}</option>
          ) : null}
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label} — {model.description}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="model-status error-status">{error}</p> : null}
      {!error && !isLoading && models.length === 0 ? (
        <p className="model-status">Install an Ollama model, then refresh.</p>
      ) : null}
    </div>
  );
}
