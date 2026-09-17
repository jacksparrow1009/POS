import Link from "next/link";
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
  Products: "/products",
};

export function AppSidebar({
  activeItem,
  branchName,
  currency,
  organizationName,
  timezone,
}: AppSidebarProps) {
  const initials = organizationName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="border-r border-[#dfe3e8] bg-white px-4 py-5">
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="grid size-10 place-items-center rounded-md bg-[#0b5c5a] text-sm font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{organizationName}</p>
          <p className="text-xs text-[#697680]">Retail POS SaaS</p>
        </div>
      </div>

      <nav className="space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const href = routes[item];
          const className = `flex h-10 w-full items-center rounded-md px-3 text-left text-sm font-medium ${
            item === activeItem
              ? "bg-[#e6f2ef] text-[#0b5c5a]"
              : "text-[#53606b] hover:bg-[#f1f3f5]"
          }`;

          return href ? (
            <Link className={className} href={href} key={item}>
              {item}
            </Link>
          ) : (
            <button className={className} disabled key={item} type="button">
              {item}
            </button>
          );
        })}
      </nav>

      <div className="mt-8 rounded-md border border-[#dfe3e8] bg-[#fbfcfc] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#697680]">
          Active branch
        </p>
        <p className="mt-2 text-sm font-semibold">{branchName}</p>
        <p className="mt-1 text-xs text-[#697680]">
          {timezone} / {currency}
        </p>
      </div>
    </aside>
  );
}
