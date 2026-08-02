export type HistoryViewState = "empty" | "error" | "loading" | "ready";

export function getHistoryViewState({
  conversationCount,
  error,
  isLoading
}: {
  conversationCount: number;
  error: string | null;
  isLoading: boolean;
}): HistoryViewState {
  if (isLoading && conversationCount === 0) {
    return "loading";
  }

  if (error && conversationCount === 0) {
    return "error";
  }

  return conversationCount === 0 ? "empty" : "ready";
}
