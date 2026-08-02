import assert from "node:assert/strict";
import test from "node:test";
import {
  getCodeForLanguageChange,
  starterCodeByLanguage,
  type SupportedLanguage
} from "./starterCode.js";

const languages = Object.keys(starterCodeByLanguage) as SupportedLanguage[];

test("provides suitable starter code for every supported language", () => {
  assert.match(starterCodeByLanguage.javascript, /function greet\(name\)/);
  assert.match(starterCodeByLanguage.typescript, /name: string/);
  assert.match(starterCodeByLanguage.python, /def greet\(name: str\)/);
  assert.match(starterCodeByLanguage.html, /<!doctype html>/i);
  assert.match(starterCodeByLanguage.css, /body \{/);
});

test("changing languages replaces every untouched starter with the next starter", () => {
  for (const [index, currentLanguage] of languages.entries()) {
    const nextLanguage = languages[(index + 1) % languages.length];

    assert.equal(
      getCodeForLanguageChange({
        code: starterCodeByLanguage[currentLanguage],
        currentLanguage,
        nextLanguage
      }),
      starterCodeByLanguage[nextLanguage]
    );
  }
});

test("changing languages never overwrites user-written code", () => {
  const userCode = "const userAnswer = 42;";

  assert.equal(
    getCodeForLanguageChange({
      code: userCode,
      currentLanguage: "javascript",
      nextLanguage: "python"
    }),
    userCode
  );
});

test("even small edits and empty editor content count as user changes", () => {
  const editedStarter = `${starterCodeByLanguage.javascript}\n`;

  assert.equal(
    getCodeForLanguageChange({
      code: editedStarter,
      currentLanguage: "javascript",
      nextLanguage: "typescript"
    }),
    editedStarter
  );
  assert.equal(
    getCodeForLanguageChange({
      code: "",
      currentLanguage: "javascript",
      nextLanguage: "python"
    }),
    ""
  );
});
