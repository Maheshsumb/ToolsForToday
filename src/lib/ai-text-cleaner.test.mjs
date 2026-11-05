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

test("preserves underscores embedded in identifiers and URLs while removing valid emphasis", () => {
  const input = [
    "customer_account_id",
    "first_name last_name",
    "some_long_variable_name",
    "file_name_2026.txt",
    "https://example.com/my_long_path",
    "https://example.com/files/user_profile_photo.png",
    "This is _important_ text.",
    "This is __important__ text.",
    "This is *important* text.",
    "This is **important** text.",
    "Use customer_account_id and _important_.",
    "See https://example.com/my_long_path for **details**.",
  ].join("\n");
  const expected = [
    "customer_account_id",
    "first_name last_name",
    "some_long_variable_name",
    "file_name_2026.txt",
    "https://example.com/my_long_path",
    "https://example.com/files/user_profile_photo.png",
    "This is important text.",
    "This is important text.",
    "This is important text.",
    "This is important text.",
    "Use customer_account_id and important.",
    "See https://example.com/my_long_path for details.",
  ].join("\n");
  assert.equal(cleanCopiedText(input, { ...DEFAULT_TEXT_CLEANER_OPTIONS, stripBasicMarkdown: true }), expected);
});

test("preserves underscore runs, URL link targets, escaped underscores, and Unicode word content", () => {
  const input = [
    "customer_account_id and some__long___identifier",
    "https://example.com/a__long___path",
    "[profile](https://example.com/user_profile_photo.png)",
    "\\_literal_underscores\\_ and \\__escaped_pair__\\",
    "é_mot_漢 and नमस्ते _दोस्त_!",
    "__customer_account_id__",
    "This_underlined_word_should_stay",
  ].join("\n");
  const expected = [
    "customer_account_id and some__long___identifier",
    "https://example.com/a__long___path",
    "profile (https://example.com/user_profile_photo.png)",
    "\\_literal_underscores\\_ and \\__escaped_pair__\\",
    "é_mot_漢 and नमस्ते दोस्त!",
    "customer_account_id",
    "This_underlined_word_should_stay",
  ].join("\n");
  assert.equal(cleanCopiedText(input, { ...DEFAULT_TEXT_CLEANER_OPTIONS, stripBasicMarkdown: true }), expected);
});

test("preserves technical underscores inside inline and fenced code while stripping the delimiters", () => {
  const input = "Run `customer_account_id __literal__ *keep*` now.\n\n```ts\nconst user_profile_id = 1;\nconst marker = __literal__\n```\n\nAfter the code.";
  const expected = "Run customer_account_id __literal__ *keep* now.\n\nconst user_profile_id = 1;\nconst marker = __literal__\nAfter the code.";
  assert.equal(cleanCopiedText(input, { ...DEFAULT_TEXT_CLEANER_OPTIONS, stripBasicMarkdown: true }), expected);
});

test("Markdown cleanup remains opt-in and leaves empty or plain text stable", () => {
  const input = "## customer_account_id and _important_\r\nPlain text";
  assert.equal(cleanCopiedText(input), "## customer_account_id and _important_\nPlain text");
  assert.equal(cleanCopiedText("", { ...DEFAULT_TEXT_CLEANER_OPTIONS, stripBasicMarkdown: true }), "");
  assert.equal(cleanCopiedText("ordinary text 123", { ...DEFAULT_TEXT_CLEANER_OPTIONS, stripBasicMarkdown: true }), "ordinary text 123");
});

test("Markdown cleanup keeps existing heading, list, link, and emphasis behavior", () => {
  const input = "# Heading\n- **bold** and _italic_\n1. [profile](https://example.com/user_profile)";
  const expected = "Heading\n• bold and italic\n1. profile (https://example.com/user_profile)";
  assert.equal(cleanCopiedText(input, { ...DEFAULT_TEXT_CLEANER_OPTIONS, stripBasicMarkdown: true }), expected);
});
