# Word & Character Counter

## Route and catalogue

The browser-only counter is available at `/tools/word-character-counter/`. Its catalogue definition is in `src/config/tools.ts`; the homepage's existing search and category filters use the same entry. The other 11 planned tools remain marked Coming soon.

## Counting rules

- Words use `Intl.Segmenter` word boundaries and `isWordLike` when supported. The fallback counts Unicode letter/mark/digit runs and keeps common apostrophes inside words.
- Characters count grapheme clusters when `Intl.Segmenter` supports grapheme segmentation. The fallback groups combining marks, variation selectors, emoji modifiers, ZWJ sequences, CRLF, and paired regional indicators.
- Characters without whitespace remove JavaScript Unicode whitespace (`\\s`) before counting graphemes; punctuation remains included.
- Sentences use browser sentence segmentation and ignore segments without letters or numbers. The fallback splits on common Latin and CJK sentence punctuation. Abbreviations and unusual punctuation can affect the estimate.
- Paragraphs are nonempty blocks split by one or more blank lines.
- Reading time uses 200 words per minute: zero words gives `0 min`, fewer than 200 gives `Under 1 min`, and longer text rounds up to a whole minute.

## Privacy and performance

Calculations run synchronously in the browser from the editor's in-memory React state. There is no text upload, text-processing API, server endpoint, browser-storage persistence, or Analytics event containing editor text. The route's Analytics page view uses a fixed allowlisted path/title through the existing consent-gated flow. Copying is user-initiated and reports clipboard access failures.

## Validation

Stage 03A local validation passed: 8 counter tests, all 8 Analytics page-view tests (including the 7 pre-existing cases), lint, strict typecheck, and static export. Browser checks covered 320px, 375px, 390px, 768px, and 1440px with no horizontal overflow; live entry, paste, copy, clear, keyboard action, catalogue filters, route navigation/history, Privacy Policy, and the custom 404 were checked.

Focused utility tests can be rerun with `npm run test:text-counter`; Analytics page-view tests use `npm run test:analytics`. Lint, strict typecheck, and static export use `npm run lint`, `npm run typecheck`, and `npm run build`.

Known counting limitations are described above: word segmentation depends on browser Intl support, the fallback may differ for some language-specific word boundaries, sentence counts are estimates, and reading speed varies by reader and material.
