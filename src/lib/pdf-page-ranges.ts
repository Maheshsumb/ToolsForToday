export const MAX_PAGE_RANGE_CHARACTERS = 4096;

export interface PdfPageRangeLimits {
  maxSourcePages: number;
  maxSelectedPages: number;
}

export function parsePdfPageRange(
  selection: string,
  pageCount: number,
  limits: PdfPageRangeLimits,
): number[] {
  if (!Number.isInteger(pageCount) || pageCount < 1) throw new Error("Choose a PDF with at least one page first.");
  if (pageCount > limits.maxSourcePages) throw new Error(`This PDF exceeds the ${limits.maxSourcePages}-page limit.`);
  if (selection.length > MAX_PAGE_RANGE_CHARACTERS) throw new Error("The page selection is too long.");
  const value = selection.trim();
  if (!value) throw new Error("Enter one or more page numbers or ranges.");

  const selected: number[] = [];
  const seen = new Set<number>();
  for (const rawPart of value.split(",")) {
    const part = rawPart.trim();
    if (!part) throw new Error("Use commas only between page numbers or ranges.");
    if (/^-\s*\d/.test(part)) throw new Error("Negative page numbers are not allowed. Page numbering starts at 1.");
    const match = /^(\d+)\s*(?:-\s*(\d+))?$/.exec(part);
    if (!match) throw new Error(`“${part}” is not a valid page number or inclusive range.`);
    const first = Number(match[1]);
    const last = match[2] === undefined ? first : Number(match[2]);
    if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last)) throw new Error("Page numbers must be whole numbers.");
    if (first < 1 || last < 1) throw new Error("Page numbers start at 1. Page 0 is not valid.");
    if (last < first) throw new Error(`The range ${first}-${last} is reversed. Put the smaller page first.`);
    if (last > pageCount) throw new Error(`Page ${last} is outside this ${pageCount}-page PDF.`);

    for (let page = first; page <= last; page += 1) {
      if (seen.has(page)) throw new Error(`Page ${page} is selected more than once. Remove duplicates or overlapping ranges.`);
      seen.add(page);
      selected.push(page);
      if (selected.length > limits.maxSelectedPages) {
        throw new Error(`Select no more than ${limits.maxSelectedPages} pages at a time.`);
      }
    }
  }
  return selected;
}
