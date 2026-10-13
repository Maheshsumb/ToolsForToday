import Link from "next/link";
import { tools, toolCategories, type ToolDefinition } from "@/config/tools";

type AvailableTool = ToolDefinition & { availability: "available"; href: `/${string}` };

interface RelatedToolsProps {
  currentToolId: string;
  title?: string;
  limit?: number;
}

export function RelatedTools({ currentToolId, title = "Related tools", limit = 3 }: RelatedToolsProps) {
  const configuredTools: readonly ToolDefinition[] = tools;
  const currentTool = configuredTools.find((tool) => tool.id === currentToolId);
  const relatedIds = currentTool?.relatedToolIds ?? [];
  const availableTools = relatedIds
    .map((id) => configuredTools.find((tool): tool is AvailableTool => tool.id === id && tool.availability === "available" && Boolean(tool.href)))
    .filter((tool): tool is AvailableTool => Boolean(tool))
    .slice(0, limit);

  if (availableTools.length === 0) return null;

  return (
    <section aria-labelledby="related-tools-heading" className="mt-10 border-t border-border pt-8">
      <h2 id="related-tools-heading" className="font-heading text-xl font-semibold text-text">{title}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {availableTools.map((tool) => (
          <li key={tool.id}>
            <Link href={tool.href} className="group block h-full rounded-xl border border-border bg-surface p-4 transition-colors hover:border-[#BBC8D9] hover:bg-surface-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
              <span className="font-semibold text-text group-hover:underline group-hover:underline-offset-4">{tool.title}</span>
              <span className="mt-1 block text-xs font-medium text-muted">{toolCategories[tool.category]}</span>
              <span className="mt-2 block text-sm leading-relaxed text-muted">{tool.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
