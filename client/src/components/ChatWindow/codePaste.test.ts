import assert from "node:assert/strict";
import test from "node:test";
import { formatPastedCode, looksLikeMultilineCode } from "./codePaste.js";

const asyncFunction = `async function functionName() {
  try {
    const result = await somePromiseOrFunction();
  } catch (error) {
    console.error(error);
  }
}`;

test("recognizes a multiline async function as code", () => {
  assert.equal(looksLikeMultilineCode(asyncFunction), true);
});

test("automatically wraps pasted code in a language-aware Markdown fence", () => {
  assert.equal(
    formatPastedCode(asyncFunction, "javascript"),
    `\`\`\`javascript\n${asyncFunction}\n\`\`\``
  );
});

test("does not format multiline prose as code", () => {
  const prose = "This is the first paragraph.\nThis is the second paragraph.";

  assert.equal(formatPastedCode(prose, "javascript"), prose);
});

test("does not add another fence to code that is already formatted", () => {
  const fencedCode = `\`\`\`typescript\nconst answer = 42;\n\`\`\``;

  assert.equal(formatPastedCode(fencedCode, "javascript"), fencedCode);
});
