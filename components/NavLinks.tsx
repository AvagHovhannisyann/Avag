"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Lightbulb,
  Table2,
  Building2,
  Calculator,
  History,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hypothesis", label: "Valuation Hypothesis", icon: Lightbulb },
  { href: "/financial-model", label: "Financial Model", icon: Table2 },
  { href: "/tangible-assets", label: "Tangible Assets", icon: Building2 },
  { href: "/toolkit", label: "Toolkit", icon: Calculator },
  { href: "/history", label: "History", icon: History },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap items-center gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
