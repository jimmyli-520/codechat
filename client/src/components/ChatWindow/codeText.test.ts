import assert from "node:assert/strict";
import test from "node:test";
import { createElement, type ReactNode } from "react";
import { getClipboardCode } from "./codeText.js";

function highlighted(className: string, children: ReactNode) {
  return createElement("span", { className }, children);
}

test("extracts Python code from syntax-highlighted React elements", () => {
  const renderedCode = [
    highlighted("hljs-built_in", "print"),
    "(",
    highlighted("hljs-string", "\"Hello, CodeChat!\""),
    ")\n"
  ];

  assert.match(String(renderedCode), /\[object Object\]/);
  assert.equal(getClipboardCode(renderedCode), 'print("Hello, CodeChat!")');
});

test("preserves JavaScript quotes, punctuation, indentation, and newlines", () => {
  const renderedCode = [
    highlighted("hljs-keyword", "const"),
    " greeting = ",
    highlighted("hljs-string", "'hello'"),
    ";\n",
    "  console.log(greeting);\n"
  ];

  assert.equal(
    getClipboardCode(renderedCode),
    "const greeting = 'hello';\n  console.log(greeting);"
  );
});

test("preserves nested TypeScript highlighting", () => {
  const renderedCode = createElement(
    "span",
    null,
    highlighted("hljs-keyword", "const"),
    " value: ",
    highlighted("hljs-built_in", "string"),
    " = ",
    highlighted("hljs-string", "`CodeChat`"),
    ";\n"
  );

  assert.equal(getClipboardCode(renderedCode), "const value: string = `CodeChat`;");
});
