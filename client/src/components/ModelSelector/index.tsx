import { modelOptions } from "../../store/modelSlice";

type ModelSelectorProps = {
  disabled: boolean;
  selectedModel: string;
  onChange: (model: string) => void;
};

export function ModelSelector({ disabled, selectedModel, onChange }: ModelSelectorProps) {
  return (
    <label className="chat-control">
      <span>Model</span>
      <select
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={selectedModel}
      >
        {modelOptions.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label} - {model.description}
          </option>
        ))}
      </select>
    </label>
  );
}
