export interface TextCleanerOptions {
  normalizeLineEndings: boolean;
  trimTrailingWhitespace: boolean;
  limitBlankLines: boolean;
  collapseRepeatedSpaces: boolean;
  normalizeSpecialSpaces: boolean;
  stripBasicMarkdown: boolean;
  removeInvisibleCodePoints: readonly number[];
}

export const DEFAULT_TEXT_CLEANER_OPTIONS: TextCleanerOptions = {
  normalizeLineEndings: true,
  trimTrailingWhitespace: true,
  limitBlankLines: true,
  collapseRepeatedSpaces: false,
  normalizeSpecialSpaces: false,
  stripBasicMarkdown: false,
  removeInvisibleCodePoints: [],
};

export const INSPECTED_INVISIBLE_CHARACTERS = [
  { codePoint: 0x00ad, name: "Soft hyphen", note: "Optional line-break hint" },
  { codePoint: 0x034f, name: "Combining grapheme joiner", note: "Can affect combining marks" },
  { codePoint: 0x061c, name: "Arabic letter mark", note: "Bidirectional text control" },
  { codePoint: 0x200b, name: "Zero-width space", note: "Can create an invisible break" },
  { codePoint: 0x200c, name: "Zero-width non-joiner", note: "Meaningful in some scripts" },
  { codePoint: 0x200d, name: "Zero-width joiner", note: "Meaningful in scripts and emoji" },
  { codePoint: 0x200e, name: "Left-to-right mark", note: "Bidirectional text control" },
  { codePoint: 0x200f, name: "Right-to-left mark", note: "Bidirectional text control" },
  { codePoint: 0x202a, name: "Left-to-right embedding", note: "Bidirectional text control" },
  { codePoint: 0x202b, name: "Right-to-left embedding", note: "Bidirectional text control" },
  { codePoint: 0x202c, name: "Pop directional formatting", note: "Bidirectional text control" },
  { codePoint: 0x202d, name: "Left-to-right override", note: "Bidirectional text control" },
  { codePoint: 0x202e, name: "Right-to-left override", note: "Bidirectional text control" },
  { codePoint: 0x2060, name: "Word joiner", note: "Prevents a line break" },
  { codePoint: 0x2066, name: "Left-to-right isolate", note: "Bidirectional text control" },
  { codePoint: 0x2067, name: "Right-to-left isolate", note: "Bidirectional text control" },
  { codePoint: 0x2068, name: "First strong isolate", note: "Bidirectional text control" },
  { codePoint: 0x2069, name: "Pop directional isolate", note: "Bidirectional text control" },
  { codePoint: 0xfeff, name: "Byte order mark / zero-width no-break space", note: "May be a text encoding marker" },
] as const;

export interface InvisibleCharacterCount {
  codePoint: number;
  name: string;
  note: string;
  count: number;
}

export function inspectInvisibleCharacters(text: string): InvisibleCharacterCount[] {
  const counts = new Map<number, number>();
  for (const character of text) {
    const codePoint = character.codePointAt(0);
    if (codePoint !== undefined) counts.set(codePoint, (counts.get(codePoint) ?? 0) + 1);
  }
  return INSPECTED_INVISIBLE_CHARACTERS.flatMap(({ codePoint, name, note }) => {
    const count = counts.get(codePoint) ?? 0;
    return count === 0 ? [] : [{ codePoint, name, note, count }];
  });
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^\s{0,3}(```|~~~)[^\r\n]*\r?\n/gmu, "")
    .replace(/^\s{0,3}(?:```|~~~)\s*$/gmu, "")
    .replace(/^\s{0,3}#{1,6}[\t ]+/gmu, "")
    .replace(/^\s{0,3}>[\t ]?/gmu, "")
    .replace(/^([\t ]*)([-*+])[\t ]+/gmu, "$1• ")
    .replace(/^([\t ]*)(\d+\.)[\t ]+/gmu, "$1$2 ")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/gu, "$1 ($2)")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gu, "$1 ($2)")
    .replace(/`([^`]+)`/gu, "$1")
    .replace(/\*\*([^*]+)\*\*/gu, "$1")
    .replace(/__([^_]+)__/gu, "$1")
    .replace(/~~([^~]+)~~/gu, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/gu, "$1$2")
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/gu, "$1$2");
}

export function cleanCopiedText(input: string, options: TextCleanerOptions = DEFAULT_TEXT_CLEANER_OPTIONS): string {
  let result = input;
  if (options.normalizeLineEndings) result = result.replace(/\r\n?/gu, "\n");
  if (options.normalizeSpecialSpaces) result = result.replace(/[\u00a0\u2007\u2009\u202f]/gu, " ");
  if (options.collapseRepeatedSpaces) result = result.replace(/[\t ]{2,}/gu, " ");
  if (options.trimTrailingWhitespace) result = result.replace(/[\t ]+$/gmu, "");
  if (options.limitBlankLines) result = result.replace(/\n(?:[\t ]*\n){2,}/gu, "\n\n");
  if (options.stripBasicMarkdown) result = stripMarkdown(result);
  if (options.removeInvisibleCodePoints.length > 0) {
    const removeSet = new Set(options.removeInvisibleCodePoints);
    result = Array.from(result).filter((character) => !removeSet.has(character.codePointAt(0) ?? -1)).join("");
  }
  return result;
}
