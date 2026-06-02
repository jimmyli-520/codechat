export type ModelOption = {
  id: string;
  label: string;
  description: string;
};

export const modelOptions: ModelOption[] = [
  {
    id: "qwen3:8b",
    label: "qwen3:8b",
    description: "Deep reasoning"
  },
  {
    id: "mistral",
    label: "mistral",
    description: "Fast & reliable"
  },
  {
    id: "phi4-mini",
    label: "phi4-mini",
    description: "Lightweight"
  },
  {
    id: "llama3.2:3b",
    label: "llama3.2:3b",
    description: "Quick answers"
  }
];
