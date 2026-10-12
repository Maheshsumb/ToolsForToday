import Link from "next/link";
import type { ComponentProps } from "react";

interface NavigationLinkProps extends Omit<ComponentProps<typeof Link>, "className"> {
  className?: string;
}

export function NavigationLink({ className = "", ...props }: NavigationLinkProps) {
  return <Link className={`inline-flex min-h-11 items-center rounded-md text-sm font-medium text-text transition-colors hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring ${className}`.trim()} {...props} />;
}
