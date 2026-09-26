"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  LogOut,
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
import { switchBranch } from "@/app/actions/branch";
import { signOut } from "@/app/auth/actions";
import { navItems } from "@/lib/pos-demo-data";

type BranchOption = {
  id: string;
  name: string;
  code: string;
};

export type AppSidebarProps = {
  activeItem: (typeof navItems)[number];
  branchId?: string;
  branchName?: string;
  branches?: BranchOption[];
  currency?: string;
  organizationName?: string;
  timezone?: string;
};

export function SidebarFallback({ activeItem }: { activeItem: (typeof navItems)[number] }) {
  return (
    <AppSidebar
      activeItem={activeItem}
      branchName="Branch"
      currency="PKR"
      organizationName="Awan POS"
      timezone="Asia/Karachi"
    />
  );
}

const routes: Partial<Record<(typeof navItems)[number], string>> = {
  Dashboard: "/",
  POS: "/pos",
  Sales: "/pos/sales",
  Products: "/products",
  Purchases: "/purchases",
  Customers: "/customers",
  Reports: "/reports",
  Settings: "/settings",
};

const icons: Record<(typeof navItems)[number], LucideIcon> = {
  Dashboard: LayoutDashboard,
  POS: ShoppingCart,
  Sales: ReceiptText,
  Products: Package,
  Purchases: ReceiptText,
  Customers: Users,
  Reports: BarChart3,
  Settings,
};

export function AppSidebar(props: AppSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const orgName = props.organizationName || "Awan POS";
  const branchName = props.branchName || "Main Branch";
  const initials = orgName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <Brand initials={initials} organizationName={orgName} />
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
          <Brand initials={initials} organizationName={orgName} />
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

        <div className="mt-auto space-y-2">
          <div className="rounded-md border border-border bg-surface-subtle p-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted">
              <span className="flex items-center gap-1.5">
                <Building2 aria-hidden="true" size={14} />
                Branch
              </span>
              {props.branches && props.branches.length > 1 ? (
                <span className="text-[10px] font-normal lowercase tracking-normal text-muted">
                  {props.branches.length} branches
                </span>
              ) : null}
            </div>

            {props.branches && props.branches.length > 1 ? (
              <form action={switchBranch} className="mt-2">
                <label htmlFor="sidebar-branch-select" className="sr-only">
                  Switch active branch
                </label>
                <select
                  id="sidebar-branch-select"
                  name="branchId"
                  defaultValue={props.branchId}
                  onChange={(e) => e.target.form?.requestSubmit()}
                  className="w-full rounded border border-border bg-surface px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-border-strong focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  {props.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </form>
            ) : (
              <p className="mt-2 truncate text-sm font-semibold">{branchName}</p>
            )}

            <p className="mt-1 truncate text-xs text-muted">
              {props.timezone || "Asia/Karachi"} / {props.currency || "PKR"}
            </p>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-xs font-medium text-muted hover:bg-surface-subtle hover:text-danger transition-colors"
            >
              <LogOut aria-hidden="true" size={15} className="shrink-0" />
              <span>Sign out</span>
            </button>
          </form>
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
