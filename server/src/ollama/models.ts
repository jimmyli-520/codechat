export const preferredDefaultModel = "llama3.2:3b";

export type InstalledModel = {
  description: string;
  id: string;
  label: string;
};

type OllamaModelDetails = {
  family?: unknown;
  parameter_size?: unknown;
  quantization_level?: unknown;
};

type OllamaTagsResponse = {
  models?: Array<{
    name?: unknown;
    model?: unknown;
    details?: OllamaModelDetails;
  }>;
};

export class ModelInventoryError extends Error {
  constructor(
    message: string,
    public readonly code: "MODEL_NOT_INSTALLED" | "NO_MODELS_INSTALLED" | "OLLAMA_UNAVAILABLE"
  ) {
    super(message);
  }
}

function getModelDescription(details?: OllamaModelDetails) {
  if (!details || typeof details !== "object") {
    return "Local Ollama model";
  }

  const values = [details.parameter_size, details.family, details.quantization_level]
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .map((value) => value.trim());

  return values.length > 0 ? values.join(" · ") : "Local Ollama model";
}

export function normalizeInstalledModels(data: unknown): InstalledModel[] {
  if (!data || typeof data !== "object" || !Array.isArray((data as OllamaTagsResponse).models)) {
    return [];
  }

  const models = (data as OllamaTagsResponse).models ?? [];
  const uniqueModels = new Map<string, InstalledModel>();

  for (const model of models) {
    const name =
      typeof model.name === "string"
        ? model.name.trim()
        : typeof model.model === "string"
          ? model.model.trim()
          : "";

    if (!name || uniqueModels.has(name)) {
      continue;
    }

    uniqueModels.set(name, {
      id: name,
      label: name,
      description: getModelDescription(model.details)
    });
  }

  return [...uniqueModels.values()].sort((left, right) => left.label.localeCompare(right.label));
}

export async function fetchInstalledModels(
  ollamaBaseUrl: string,
  fetchImplementation: typeof fetch = fetch
) {
  let response: Response;

  try {
    response = await fetchImplementation(`${ollamaBaseUrl}/api/tags`);
  } catch {
    throw new ModelInventoryError("Could not connect to Ollama.", "OLLAMA_UNAVAILABLE");
  }

  if (!response.ok) {
    throw new ModelInventoryError("Could not load installed Ollama models.", "OLLAMA_UNAVAILABLE");
  }

  try {
    return normalizeInstalledModels(await response.json());
  } catch {
    throw new ModelInventoryError("Ollama returned an invalid model list.", "OLLAMA_UNAVAILABLE");
  }
}

export function resolveInstalledModel({
  installedModels,
  requestedModel
}: {
  installedModels: InstalledModel[];
  requestedModel?: string;
}) {
  if (installedModels.length === 0) {
    throw new ModelInventoryError(
      "No Ollama models are installed. Install a model before starting a chat.",
      "NO_MODELS_INSTALLED"
    );
  }

  const normalizedRequestedModel = requestedModel?.trim();

  if (normalizedRequestedModel) {
    if (!installedModels.some((model) => model.id === normalizedRequestedModel)) {
      throw new ModelInventoryError(
        `The model "${normalizedRequestedModel}" is not installed locally. Refresh the model list and choose an installed model.`,
        "MODEL_NOT_INSTALLED"
      );
    }

    return normalizedRequestedModel;
  }

  return installedModels.some((model) => model.id === preferredDefaultModel)
    ? preferredDefaultModel
    : installedModels[0].id;
}
