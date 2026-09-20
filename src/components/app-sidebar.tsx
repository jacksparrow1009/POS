"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Building2,
  LayoutDashboard,
  Menu,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Store,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { navItems } from "@/lib/pos-demo-data";

type AppSidebarProps = {
  activeItem: (typeof navItems)[number];
  branchName: string;
  currency: string;
  organizationName: string;
  timezone: string;
};

const routes: Partial<Record<(typeof navItems)[number], string>> = {
  Dashboard: "/",
  POS: "/pos",
  Sales: "/pos/sales",
  Products: "/products",
};

const icons: Record<(typeof navItems)[number], LucideIcon> = {
  Dashboard: LayoutDashboard,
  POS: ShoppingCart,
  Sales: ReceiptText,
  Products: Package,
  Inventory: Boxes,
  Purchases: ReceiptText,
  Customers: Users,
  Reports: BarChart3,
  Settings,
};

export function AppSidebar(props: AppSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = props.organizationName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <Brand initials={initials} organizationName={props.organizationName} />
        <button
          aria-expanded={open}
          aria-label="Open navigation"
          className="grid size-10 place-items-center rounded-md border border-border text-muted-strong hover:bg-surface-subtle"
          onClick={() => setOpen(true)}
          type="button"
        >
          <Menu aria-hidden="true" size={20} />
        </button>
      </div>

      {open ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-border bg-surface p-4 transition-transform lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:w-auto lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-1 pb-6 pt-1">
          <Brand initials={initials} organizationName={props.organizationName} />
          <button
            aria-label="Close navigation"
            className="grid size-9 place-items-center rounded-md text-muted hover:bg-surface-subtle lg:hidden"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </div>

        <nav className="space-y-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const href = routes[item];
            const Icon = icons[item];
            const active = item === (pathname.startsWith("/pos/sales") ? "Sales" : props.activeItem);
            const className = `flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors ${
              active
                ? "bg-brand-soft text-brand"
                : "text-muted-strong hover:bg-surface-subtle hover:text-foreground"
            }`;
            const content = (
              <>
                <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
                <span>{item}</span>
                {!href ? <span className="ml-auto text-[10px] font-semibold uppercase text-muted">Soon</span> : null}
              </>
            );

            return href ? (
              <Link className={className} href={href} key={item} onClick={() => setOpen(false)}>
                {content}
              </Link>
            ) : (
              <button aria-disabled="true" className={`${className} opacity-65`} disabled key={item} type="button">
                {content}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-md border border-border bg-surface-subtle p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
            <Building2 aria-hidden="true" size={15} />
            Active branch
          </div>
          <p className="mt-2 truncate text-sm font-semibold">{props.branchName}</p>
          <p className="mt-1 truncate text-xs text-muted">
            {props.timezone} / {props.currency}
          </p>
        </div>
      </aside>
    </>
  );
}

function Brand({ initials, organizationName }: { initials: string; organizationName: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-md bg-brand text-xs font-bold text-white">
        {initials || <Store aria-hidden="true" size={18} />}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{organizationName}</p>
        <p className="text-xs text-muted">Retail workspace</p>
      </div>
    </div>
  );
}
