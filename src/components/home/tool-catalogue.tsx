"use client";

import { useMemo, useState } from "react";
import { tools, toolCategories, type ToolCategory } from "@/config/tools";
import { ToolCard } from "@/components/home/tool-card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

type CategoryFilter = "all" | ToolCategory;

const filters: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All Tools" },
  { id: "image", label: toolCategories.image },
  { id: "pdf", label: toolCategories.pdf },
  { id: "utility", label: toolCategories.utility },
];

export function ToolCatalogue() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredTools = useMemo(() => tools.filter((tool) => {
    const matchesCategory = category === "all" || tool.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;

    const searchableText = [tool.title, tool.description, tool.slug, ...tool.searchKeywords]
      .join(" ")
      .toLowerCase();
    return searchableText.includes(normalizedQuery);
  }), [category, normalizedQuery]);

  return (
    <section id="tools" aria-labelledby="tools-heading" className="scroll-mt-6 bg-surface-muted/45 py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="tools-heading"
            title="Find the tool you need"
            description="Search all 12 available tools or browse 5 Utilities, 3 Image Tools and 4 PDF Tools."
          />
          <div className="w-full lg:max-w-sm">
            <label htmlFor="tool-search" className="mb-2 block text-sm font-semibold text-text">Search tools</label>
            <div className="relative">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-muted"><circle cx="10.8" cy="10.8" r="6.8" /><path strokeLinecap="round" d="m16 16 4.5 4.5" /></svg>
              <input
                id="tool-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try “image” or “word count”"
                autoComplete="off"
                className="min-h-12 w-full rounded-xl border border-border bg-surface py-3 pr-4 pl-11 text-sm text-text shadow-sm placeholder:text-muted/80 focus-visible:border-deep-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter tools by category">
          {filters.map((filter) => {
            const selected = category === filter.id;
            return (
              <Button
                key={filter.id}
                variant={selected ? "primary" : "secondary"}
                size="compact"
                aria-pressed={selected}
                onClick={() => setCategory(filter.id)}
                className={`min-h-11 rounded-full px-4 text-sm ${selected ? "" : "border-border"}`}
              >
                {filter.label}
              </Button>
            );
          })}
        </div>

        <div className="mt-7 flex min-h-6 items-center justify-between gap-4">
          <p className="text-sm text-muted" aria-live="polite" aria-atomic="true">
            Showing <span className="font-semibold text-text">{filteredTools.length}</span> {filteredTools.length === 1 ? "tool" : "tools"}
          </p>
          {query ? (
            <Button variant="subtle" size="compact" onClick={() => setQuery("")} className="min-h-11 px-2 text-sm underline underline-offset-4">
              Clear search
            </Button>
          ) : null}
        </div>

        {filteredTools.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-[#BBC8D9] bg-surface px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-muted" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6"><circle cx="10.8" cy="10.8" r="6.8" /><path strokeLinecap="round" d="m16 16 4.5 4.5M8 10.8h5.6" /></svg>
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold text-text">No tools found</h3>
            <p className="mt-1 text-sm text-muted">Try another search or clear it to see all 12 tools.</p>
            {query ? <Button variant="secondary" onClick={() => setQuery("")} className="mt-5">Clear search</Button> : null}
          </div>
        )}
      </Container>
    </section>
  );
}
