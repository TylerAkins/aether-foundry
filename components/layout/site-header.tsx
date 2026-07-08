"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import * as React from "react";

import { publicNavigationItems } from "@/components/layout/public-navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Aether Foundry home"
        >
          <Image
            src="/branding/icon.svg"
            alt=""
            aria-hidden="true"
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-lg"
            priority
          />
          <Image
            src="/branding/logo.svg"
            alt="Aether Foundry"
            width={128}
            height={24}
            className="h-6 w-32 shrink-0"
            priority
          />
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 sm:flex">
          {publicNavigationItems.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <MobileNavigation />
      </div>
    </header>
  );
}

function NavLink({
  children,
  className,
  href,
  ...props
}: React.ComponentProps<typeof Link> & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

function MobileNavigation() {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuId = "mobile-primary-navigation";

  return (
    <div className="sm:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close primary navigation" : "Open primary navigation"}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <X aria-hidden /> : <Menu aria-hidden />}
      </Button>

      <nav
        id={menuId}
        aria-label="Mobile primary navigation"
        className={cn(
          "absolute inset-x-4 top-[calc(100%+0.5rem)] rounded-lg border border-slate-200 bg-white p-2 shadow-lg",
          isOpen ? "block" : "hidden"
        )}
      >
        {publicNavigationItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            className="block px-3 py-3"
            onClick={() => setIsOpen(false)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
