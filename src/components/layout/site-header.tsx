import Image from "next/image";
import Link from "next/link";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Container } from "@/components/ui/container";
import { NavigationLink } from "@/components/ui/navigation-link";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <Container className="flex min-h-20 items-center justify-between gap-4 py-3 sm:min-h-24">
        <Link href="/" aria-label="ToolsForToday home" className="inline-flex min-w-0 shrink items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring">
          <Image
            src="/brand/toolsfortoday-icon.webp"
            alt=""
            width={731}
            height={807}
            sizes="52px"
            priority
            className="h-12 w-auto md:hidden"
          />
          <Image
            src="/brand/toolsfortoday-logo.webp"
            alt=""
            width={2172}
            height={724}
            sizes="240px"
            priority
            className="hidden h-auto w-[210px] md:block md:w-[240px]"
          />
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-8 md:flex">
          <NavigationLink href="/">Home</NavigationLink>
        </nav>
        <MobileNavigation />
      </Container>
    </header>
  );
}
