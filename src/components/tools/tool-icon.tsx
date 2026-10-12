import type { ToolIcon as ToolIconName } from "@/config/tools";

interface ToolIconProps {
  name: ToolIconName;
  className?: string;
}

export function ToolIcon({ name, className = "" }: ToolIconProps) {
  const common = {
    "aria-hidden": true as const,
    className: `h-6 w-6 ${className}`.trim(),
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.7,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "image-compressor":
      return <svg {...common}><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z" /><circle cx="9" cy="9" r="1.5" /><path d="m20 15-4.3-4.3L8 18.5M3 12H1m4-8L3.5 2.5M12 3V1m8 4 1.5-1.5" /></svg>;
    case "image-resizer":
      return <svg {...common}><rect x="5" y="5" width="14" height="14" rx="2" /><path d="M5 14h14M10 5v14M2 8V4a2 2 0 0 1 2-2h4m8 0h4v4m2 8v4h-4m-8 2H4a2 2 0 0 1-2-2v-4" /></svg>;
    case "image-converter":
      return <svg {...common}><rect x="3.5" y="4" width="14" height="15" rx="2" /><circle cx="8" cy="9" r="1.3" /><path d="m17.5 15-4-4-6 6m7-2 2.5 2.5M18 7h4m-2-2 2 2-2 2" /></svg>;
    case "merge-pdf":
      return <svg {...common}><path d="M6 3h8l4 4v4M14 3v4h4M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5m7-9v4m-2-2h4" /><path d="M13 20h8" /></svg>;
    case "split-pdf":
      return <svg {...common}><path d="M6 3h8l4 4v3M14 3v4h4M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" /><path d="M13 13h8m-4-4 4 4-4 4" /></svg>;
    case "images-to-pdf":
      return <svg {...common}><rect x="3" y="4" width="13" height="13" rx="2" /><path d="m4 14 4-4 3 3 2-2 3 3M7 7h.01" /><path d="M8 20h10a2 2 0 0 0 2-2V9" /></svg>;
    case "pdf-to-jpg":
      return <svg {...common}><path d="M6 3h8l4 4v5M14 3v4h4M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5" /><rect x="12" y="14" width="9" height="7" rx="1.5" /><circle cx="15" cy="16.5" r=".7" /><path d="m13 20 2-2 1.3 1.2 1.2-1.2L20 20" /></svg>;
    case "qr-code":
      return <svg {...common}><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zm4 0h2v2h-2zm-4 4h2v2h-2zm4 0h2v2h-2z" /></svg>;
    case "text-counter":
      return <svg {...common}><path d="M4 5h16M4 9h12M4 13h16M4 17h8M4 21h5" /><circle cx="18" cy="18" r="3" /></svg>;
    case "percentage":
      return <svg {...common}><circle cx="7" cy="7" r="3" /><circle cx="17" cy="17" r="3" /><path d="m19 5-14 14" /></svg>;
    case "unit-converter":
      return <svg {...common}><path d="M3 7h16m-4-4 4 4-4 4M21 17H5m4-4-4 4 4 4" /></svg>;
    case "date-calculator":
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18m-13 4h2m3 0h2m-7 3h2m3 0h2" /></svg>;
  }
}
