import assert from "node:assert/strict";
import test from "node:test";
import { countText, getReadingTime } from "./text-counts.ts";

test("empty and whitespace-only text has zero counts", () => {
  for (const text of ["", "   \t\r\n  "]) {
    assert.deepEqual(countText(text), {
      words: 0,
      characters: text === "" ? 0 : 7,
      charactersWithoutWhitespace: 0,
      sentences: 0,
      paragraphs: 0,
      readingTime: "0 min",
    });
  }
});

test("counts one and multiple words with punctuation", () => {
  assert.equal(countText("Hello!").words, 1);
  assert.equal(countText("Hello, world. Isn't it nice?").words, 5);
  assert.equal(countText("... !!! —").words, 0);
});

test("counts spaces, tabs, and line breaks as characters but not no-whitespace characters", () => {
  const result = countText("one  two\tthree\nfour");
  assert.equal(result.words, 4);
  assert.equal(result.characters, 19);
  assert.equal(result.charactersWithoutWhitespace, 15);
});

test("counts sentence boundaries and ignores punctuation-only fragments", () => {
  assert.equal(countText("First sentence. Is this the second? Yes!").sentences, 3);
  assert.equal(countText("... !!!").sentences, 0);
});

test("paragraphs are nonempty blocks separated by one or more blank lines", () => {
  assert.equal(countText("One paragraph.\nStill one.\n\nSecond paragraph.\n\n\nThird.").paragraphs, 3);
  assert.equal(countText("\n\n  \n").paragraphs, 0);
});

test("Unicode words, accented text, combining marks, and emoji are counted sensibly", () => {
  const text = "Café e\u0301lan 👩‍👩‍👧‍👦 🇮🇳 👍🏽";
  const result = countText(text);
  assert.equal(result.words, 2);
  assert.equal(result.characters, 15);
  assert.equal(result.charactersWithoutWhitespace, 11);
});

test("reading time uses 200 words per minute and rounds up to whole minutes", () => {
  assert.equal(getReadingTime(0), "0 min");
  assert.equal(getReadingTime(1), "Under 1 min");
  assert.equal(getReadingTime(199), "Under 1 min");
  assert.equal(getReadingTime(200), "1 min");
  assert.equal(getReadingTime(201), "2 mins");
  assert.equal(getReadingTime(400), "2 mins");
});

test("counts recompute from pasted, edited, and cleared text values", () => {
  assert.equal(countText("Pasted text, with two sentences. Nice!").words, 6);
  assert.equal(countText("Edited").words, 1);
  assert.equal(countText("").words, 0);
});
