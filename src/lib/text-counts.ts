export interface TextCounts {
  words: number;
  characters: number;
  charactersWithoutWhitespace: number;
  sentences: number;
  paragraphs: number;
  readingTime: string;
}

type SegmentRecord = { segment: string; isWordLike?: boolean };
type SegmenterConstructor = new (
  locale?: string | string[],
  options?: { granularity: "word" | "grapheme" | "sentence" },
) => { segment(input: string): Iterable<SegmentRecord> };

function getSegmenter(granularity: "word" | "grapheme" | "sentence"): InstanceType<SegmenterConstructor> | undefined {
  const Segmenter = (Intl as typeof Intl & { Segmenter?: SegmenterConstructor }).Segmenter;
  return Segmenter ? new Segmenter(undefined, { granularity }) : undefined;
}

function countWords(text: string): number {
  const segmenter = getSegmenter("word");
  if (segmenter) {
    let count = 0;
    for (const part of segmenter.segment(text)) {
      if (part.isWordLike) count += 1;
    }
    return count;
  }

  // Keep apostrophes inside a word and include letters, combining marks, and digits.
  return [...text.matchAll(/[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}\p{N}]+)*/gu)].length;
}

function isGraphemeExtend(character: string): boolean {
  const codePoint = character.codePointAt(0) ?? 0;
  return /\p{Mark}/u.test(character)
    || (codePoint >= 0xfe00 && codePoint <= 0xfe0f)
    || (codePoint >= 0xe0100 && codePoint <= 0xe01ef)
    || (codePoint >= 0x1f3fb && codePoint <= 0x1f3ff)
    || (codePoint >= 0xe0020 && codePoint <= 0xe007f);
}

function countGraphemesFallback(text: string): number {
  const characters = Array.from(text);
  let count = 0;
  let regionalIndicatorRun = 0;
  let previous = "";

  for (const character of characters) {
    const codePoint = character.codePointAt(0) ?? 0;
    const isRegionalIndicator = codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff;
    const joinsPrevious = count > 0 && (
      isGraphemeExtend(character)
      || character === "\u200d"
      || previous === "\u200d"
      || (previous === "\r" && character === "\n")
      || (isRegionalIndicator && regionalIndicatorRun % 2 === 1)
    );

    if (!joinsPrevious) count += 1;
    regionalIndicatorRun = isRegionalIndicator ? regionalIndicatorRun + 1 : 0;
    previous = character;
  }

  return count;
}

function countCharacters(text: string): number {
  const segmenter = getSegmenter("grapheme");
  if (!segmenter) return countGraphemesFallback(text);

  let count = 0;
  for (const part of segmenter.segment(text)) {
    if (part.segment.length > 0) count += 1;
  }
  return count;
}

function countSentences(text: string): number {
  const hasWords = (value: string) => /[\p{L}\p{N}]/u.test(value);
  const segmenter = getSegmenter("sentence");
  if (segmenter) {
    let count = 0;
    for (const part of segmenter.segment(text)) {
      if (part.segment.trim() && hasWords(part.segment)) count += 1;
    }
    return count;
  }

  return (text.match(/[^.!?。！？]+(?:[.!?。！？]+["'”’)}\]]*)?/gu) ?? [])
    .filter((sentence) => hasWords(sentence)).length;
}

function countParagraphs(text: string): number {
  return text
    .split(/\r?\n(?:[\t ]*\r?\n)+/u)
    .filter((paragraph) => paragraph.trim().length > 0)
    .length;
}

export function getReadingTime(words: number): string {
  if (words <= 0) return "0 min";
  if (words < 200) return "Under 1 min";
  const minutes = Math.ceil(words / 200);
  return `${minutes} ${minutes === 1 ? "min" : "mins"}`;
}

export function countText(text: string): TextCounts {
  const words = countWords(text);
  return {
    words,
    characters: countCharacters(text),
    charactersWithoutWhitespace: countCharacters(text.replace(/\s/gu, "")),
    sentences: countSentences(text),
    paragraphs: countParagraphs(text),
    readingTime: getReadingTime(words),
  };
}
