import { Suspense } from "react";
import { AppSidebar, SidebarFallback } from "@/components/app-sidebar";
import { getCurrentWorkspace } from "@/lib/workspace";

export default function PosLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[244px_minmax(0,1fr)] print:block">
        <Suspense fallback={<div className="print:hidden"><SidebarFallback activeItem="POS" /></div>}><PosSidebar /></Suspense>
        {children}
      </div>
    </main>
  );
}

async function PosSidebar() {
  const { organization, branch, branches } = await getCurrentWorkspace();
  return (
    <div className="contents print:hidden">
      <AppSidebar
        activeItem="POS"
        branchId={branch?.id}
        branchName={branch?.name ?? "No active branch"}
        branches={branches}
        currency={organization.currency_code.trim()}
        organizationName={organization.name}
        timezone={branch?.timezone ?? organization.timezone}
      />
    </div>
  );
}
