import type { ElementType, ReactNode } from "react";

interface SectionHeadingProps {
  title: string;
  id?: string;
  description?: string;
  as?: Extract<ElementType, "h1" | "h2" | "h3">;
  children?: ReactNode;
  className?: string;
}

export function SectionHeading({ title, id, description, as: Heading = "h2", children, className = "" }: SectionHeadingProps) {
  return (
    <div className={`max-w-3xl ${className}`.trim()}>
      <Heading id={id} className="font-heading text-3xl leading-tight font-semibold tracking-tight text-text sm:text-4xl">{title}</Heading>
      {description ? <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{description}</p> : null}
      {children}
    </div>
  );
}
