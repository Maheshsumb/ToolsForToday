"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { NavigationLink } from "@/components/ui/navigation-link";

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = "mobile-primary-navigation";

  function closeMenu() {
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function handleNavigate() {
    closeMenu();
    triggerRef.current?.focus();
  }

  return (
    <div className="relative md:hidden">
      <Button
        ref={triggerRef}
        variant="subtle"
        size="compact"
        className="h-11 w-11 p-0"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true" className="flex w-5 flex-col gap-1.25">
          <span className={`h-0.5 w-full rounded bg-current transition-transform ${isOpen ? "translate-y-1.75 rotate-45" : ""}`} />
          <span className={`h-0.5 w-full rounded bg-current transition-opacity ${isOpen ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-full rounded bg-current transition-transform ${isOpen ? "-translate-y-1.75 -rotate-45" : ""}`} />
        </span>
      </Button>
      <nav
        id={menuId}
        aria-label="Primary navigation"
        hidden={!isOpen}
        className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-surface p-2 shadow-lg"
      >
        <NavigationLink href="/" onClick={handleNavigate} className="w-full px-3">Home</NavigationLink>
      </nav>
    </div>
  );
}
