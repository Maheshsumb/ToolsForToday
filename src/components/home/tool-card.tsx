import Link from "next/link";
import type { ToolDefinition } from "@/config/tools";
import { toolCategories } from "@/config/tools";
import { ToolIcon } from "@/components/tools/tool-icon";

const iconStyles = {
  image: "bg-[#FFF1EB] text-[#B84222]",
  pdf: "bg-[#EAF5FB] text-[#176A8B]",
  utility: "bg-[#E9F7F3] text-[#176B58]",
} as const;

interface ToolCardProps {
  tool: ToolDefinition;
}

export function ToolCard({ tool }: ToolCardProps) {
  const title = tool.availability === "available" && tool.href ? (
    <Link href={tool.href} className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
      {tool.title}
    </Link>
  ) : (
    <span>{tool.title}</span>
  );

  return (
    <article className="flex min-h-64 flex-col rounded-2xl border border-border bg-surface p-5 shadow-[0_2px_8px_rgba(22,35,63,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-[#BBC8D9] hover:shadow-[0_12px_28px_rgba(22,35,63,0.08)] motion-reduce:transform-none motion-reduce:transition-none sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconStyles[tool.category]}`}>
          <ToolIcon name={tool.icon} />
        </span>
        {tool.availability === "coming-soon" ? (
          <span className="inline-flex min-h-7 items-center rounded-full border border-[#F1C5B6] bg-[#FFF7F3] px-2.5 text-xs font-semibold text-[#8C351C]">Coming soon</span>
        ) : (
          <span className="inline-flex min-h-7 items-center rounded-full border border-[#A6D9C9] bg-[#EFF9F5] px-2.5 text-xs font-semibold text-[#14563F]">Available</span>
        )}
      </div>
      <h3 className="mt-5 font-heading text-lg leading-snug font-semibold text-text">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{tool.description}</p>
      <p className="mt-5 border-t border-border pt-3 text-xs font-medium text-muted">{toolCategories[tool.category]}</p>
    </article>
  );
}
