import type { LanguageOption } from "./store";
import type { PersonaOption } from "./modeSlice";

export const editorContextMarker = "[Editor context included";

const editorReferencePatterns = [
  /\b(this|the|my|current|above|editor)\s+(code|function|component|script|snippet|implementation|program)\b/i,
  /\b(code|function|component|script|snippet|implementation|program)\s+(in|from)\s+(the\s+)?editor\b/i,
  /\b(what does|explain|review|debug|fix|refactor|optimi[sz]e|improve|test)\s+(this|the|my)\b/i,
  /\b(what does this do|why (does|is|doesn't|isn't) this|find (the )?(bug|issue)|what('s| is) wrong)\b/i
];

export function referencesEditorCode(question: string) {
  const normalizedQuestion = question.trim();

  return (
    normalizedQuestion.length > 0 &&
    editorReferencePatterns.some((pattern) => pattern.test(normalizedQuestion))
  );
}

export function includesEditorContext(message: string) {
  return message.includes(editorContextMarker);
}

export function getEditorDefaultPrompt(persona: PersonaOption["id"]) {
  switch (persona) {
    case "code-reviewer":
      return "Please review this code for bugs, edge cases, readability, and practical improvements.";
    case "code-teacher":
      return "Please explain this code step by step and teach the concepts it uses. Do not focus only on bugs unless there is a clear issue.";
    case "code-generator":
      return "Please suggest a cleaner or extended version of this code. The user can provide a specific requirement for better generated code.";
  }
}

export function buildEditorContextMessage({
  code,
  language,
  languageLabel,
  question
}: {
  code: string;
  language: LanguageOption["id"];
  languageLabel: string;
  question: string;
}) {
  return [
    question.trim(),
    "",
    `[Editor context included · ${languageLabel}]`,
    `\`\`\`${language}`,
    code.trim(),
    "```"
  ].join("\n");
}

export function prepareChatMessage({
  code,
  forceEditorContext = false,
  language,
  languageLabel,
  persona,
  question
}: {
  code: string;
  forceEditorContext?: boolean;
  language: LanguageOption["id"];
  languageLabel: string;
  persona: PersonaOption["id"];
  question: string;
}) {
  const trimmedCode = code.trim();
  const trimmedQuestion = question.trim();
  const shouldIncludeEditorContext =
    Boolean(trimmedCode) && (forceEditorContext || referencesEditorCode(trimmedQuestion));
  const resolvedQuestion =
    trimmedQuestion || (forceEditorContext && trimmedCode ? getEditorDefaultPrompt(persona) : "");

  if (!resolvedQuestion) {
    return "";
  }

  return shouldIncludeEditorContext || (forceEditorContext && trimmedCode)
    ? buildEditorContextMessage({
        code: trimmedCode,
        language,
        languageLabel,
        question: resolvedQuestion
      })
    : resolvedQuestion;
}
