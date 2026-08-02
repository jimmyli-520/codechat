export type SupportedLanguage = "javascript" | "typescript" | "python" | "html" | "css";

export const starterCodeByLanguage: Record<SupportedLanguage, string> = {
  javascript: `function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("CodeChat"));`,
  typescript: `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("CodeChat"));`,
  python: `def greet(name: str) -> str:
    return f"Hello, {name}!"


print(greet("CodeChat"))`,
  html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeChat</title>
  </head>
  <body>
    <h1>Hello, CodeChat!</h1>
  </body>
</html>`,
  css: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #20242a;
  background: #f6f5f2;
}

.card {
  max-width: 36rem;
  margin: 2rem auto;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background: white;
}`
};

export function getCodeForLanguageChange({
  code,
  currentLanguage,
  nextLanguage
}: {
  code: string;
  currentLanguage: SupportedLanguage;
  nextLanguage: SupportedLanguage;
}) {
  if (
    currentLanguage !== nextLanguage &&
    code === starterCodeByLanguage[currentLanguage]
  ) {
    return starterCodeByLanguage[nextLanguage];
  }

  return code;
}
