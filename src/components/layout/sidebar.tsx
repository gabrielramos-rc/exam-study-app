"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/config/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-14 border-r border-border bg-background">
      <nav className="flex-1 space-y-1 px-3 py-4">
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
