import { AppSidebar, SidebarFallback } from "@/components/app-sidebar";
import { getCurrentWorkspace } from "@/lib/workspace";
import { Suspense } from "react";

export default function PurchasesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[244px_minmax(0,1fr)]">
        <Suspense fallback={<SidebarFallback activeItem="Purchases" />}>
          <PurchasesSidebar />
        </Suspense>
        {children}
      </div>
    </main>
  );
}

async function PurchasesSidebar() {
  const { organization, branch, branches } = await getCurrentWorkspace();

  return (
    <AppSidebar
      activeItem="Purchases"
      branchId={branch?.id}
      branchName={branch?.name ?? "No active branch"}
      branches={branches}
      currency={organization.currency_code.trim()}
      organizationName={organization.name}
      timezone={branch?.timezone ?? organization.timezone}
    />
  );
}
