import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarSkeleton } from "@/components/loading-skeletons";
import { getCurrentWorkspace } from "@/lib/workspace";

export default function PosLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[244px_minmax(0,1fr)] print:block">
        <Suspense fallback={<div className="print:hidden"><SidebarSkeleton /></div>}><PosSidebar /></Suspense>
        {children}
      </div>
    </main>
  );
}

async function PosSidebar() {
  const { organization, branch } = await getCurrentWorkspace();
  return <div className="contents print:hidden"><AppSidebar activeItem="POS" branchName={branch?.name ?? "No active branch"}
    currency={organization.currency_code.trim()} organizationName={organization.name}
    timezone={branch?.timezone ?? organization.timezone} /></div>;
}
