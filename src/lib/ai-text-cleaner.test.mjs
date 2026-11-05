import assert from "node:assert/strict";
import test from "node:test";
import { cleanCopiedText, DEFAULT_TEXT_CLEANER_OPTIONS, inspectInvisibleCharacters } from "./ai-text-cleaner.ts";

test("conservative defaults normalize line endings, trim trailing spaces, and limit blank lines", () => {
  assert.equal(cleanCopiedText("one  \r\n\r\n\r\ntwo\t"), "one\n\ntwo");
});

test("repeated spaces, special Unicode spaces, and Markdown are opt-in", () => {
  const input = "# **Title**\n\nA  B\u00a0C and [a link](https://example.test)";
  assert.equal(cleanCopiedText(input), input);
  const result = cleanCopiedText(input, {
    ...DEFAULT_TEXT_CLEANER_OPTIONS,
    collapseRepeatedSpaces: true,
    normalizeSpecialSpaces: true,
    stripBasicMarkdown: true,
  });
  assert.equal(result, "Title\n\nA B C and a link (https://example.test)");
});

test("inspects invisible characters by name and count", () => {
  assert.deepEqual(inspectInvisibleCharacters("A\u200b\u200bB\u200d👩‍💻"), [
    { codePoint: 0x200b, name: "Zero-width space", note: "Can create an invisible break", count: 2 },
    { codePoint: 0x200d, name: "Zero-width joiner", note: "Meaningful in scripts and emoji", count: 2 },
  ]);
});

test("removes only explicitly selected invisible characters", () => {
  const input = "मराठी\u200c शब्द 👩‍💻\u200b";
  const cleaned = cleanCopiedText(input, { ...DEFAULT_TEXT_CLEANER_OPTIONS, removeInvisibleCodePoints: [0x200b] });
  assert.equal(cleaned, "मराठी\u200c शब्द 👩‍💻");
});

test("preserves punctuation, multilingual text, mathematical notation, and emoji by default", () => {
  const input = "Hola, नमस्ते! 2 × 3 = 6. 👩‍👩‍👧‍👦";
  assert.equal(cleanCopiedText(input), input);
});

test("strips fenced Markdown code blocks at each line while retaining their content", () => {
  const input = "```js\nconst value = 1;\n```\n\n~~~text\nhello\n~~~";
  assert.equal(cleanCopiedText(input, { ...DEFAULT_TEXT_CLEANER_OPTIONS, stripBasicMarkdown: true }), "const value = 1;\nhello\n");
});
