type ComposerKey = {
  ctrlKey: boolean;
  key: string;
  shiftKey: boolean;
};

export type ComposerKeyAction = "ignore" | "newline" | "send";

export function getComposerKeyAction({ key, shiftKey }: ComposerKey): ComposerKeyAction {
  if (key !== "Enter") {
    return "ignore";
  }

  if (shiftKey) {
    return "newline";
  }

  return "send";
}

export function canSubmitComposer({
  action,
  input,
  isLoading
}: {
  action: ComposerKeyAction;
  input: string;
  isLoading: boolean;
}) {
  return action === "send" && Boolean(input.trim()) && !isLoading;
}
