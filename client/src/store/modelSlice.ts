export type ModelOption = {
  id: string;
  label: string;
  description: string;
};

export const preferredDefaultModel = "llama3.2:3b";

export function reconcileSelectedModel({
  models,
  selectedModel
}: {
  models: ModelOption[];
  selectedModel: string;
}) {
  if (models.some((model) => model.id === selectedModel)) {
    return selectedModel;
  }

  if (models.some((model) => model.id === preferredDefaultModel)) {
    return preferredDefaultModel;
  }

  return models[0]?.id ?? "";
}
