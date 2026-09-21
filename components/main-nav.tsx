"use client";

import Link from "next/link"
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils"

// Only routes that exist are linked. Planned Release 1 sections are shown as
// inert "soon" items so the shell communicates direction without dead links.
const routes = [
  { href: '/', label: 'Dashboard' },
  { href: '/stores', label: 'Stores' },
]
const plannedRoutes = ['Billing']

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      {routes.map((route) => {
        const active =
          route.href === '/'
            ? pathname === '/'
            : pathname === route.href || pathname.startsWith(`${route.href}/`);
        return (
          <Link
            key={route.href}
            href={route.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary',
              active ? 'text-black dark:text-white' : 'text-muted-foreground'
            )}
          >
            {route.label}
          </Link>
        );
      })}
      {plannedRoutes.map((label) => (
        <span
          key={label}
          className="text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
          title="Coming soon"
        >
          {label}
        </span>
      ))}
    </nav>
  )
};
