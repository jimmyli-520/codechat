const codeSignals = [
  /[{};]\s*$/m,
  /^\s{2,}\S/m,
  /\b(async|await|class|const|def|else|function|if|import|interface|let|return|try|catch|var)\b/,
  /=>|<\/?[a-z][^>]*>|\w+\([^)]*\)\s*[{:]?/i
];

export function looksLikeMultilineCode(text: string) {
  const normalizedText = text.replace(/\r\n/g, "\n").trim();

  return (
    normalizedText.includes("\n") &&
    codeSignals.filter((pattern) => pattern.test(normalizedText)).length >= 2
  );
}

export function formatPastedCode(text: string, language: string) {
  const normalizedText = text.replace(/\r\n/g, "\n");

  if (/^\s*```[\s\S]*```\s*$/.test(normalizedText) || !looksLikeMultilineCode(normalizedText)) {
    return normalizedText;
  }

  return `\`\`\`${language}\n${normalizedText.trim()}\n\`\`\``;
}
