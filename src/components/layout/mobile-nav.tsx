"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/config/navigation";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          // Normalize paths with trailing slashes to prevent parent routes
          // from being marked active when viewing child routes
          const normalizedPathname = pathname.endsWith("/") ? pathname : pathname + "/";
          const normalizedHref = item.href.endsWith("/") ? item.href : item.href + "/";
          const isActive =
            pathname === item.href || normalizedPathname === normalizedHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium transition-colors min-w-[64px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
