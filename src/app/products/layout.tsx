import { AppSidebar } from "@/components/app-sidebar";
import { SidebarSkeleton } from "@/components/loading-skeletons";
import { getCurrentWorkspace } from "@/lib/workspace";
import { Suspense } from "react";

export default function ProductsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[244px_minmax(0,1fr)]">
        <Suspense fallback={<SidebarSkeleton />}>
          <ProductsSidebar />
        </Suspense>
        {children}
      </div>
    </main>
  );
}

async function ProductsSidebar() {
  const { organization, branch } = await getCurrentWorkspace();

  return (
    <AppSidebar
      activeItem="Products"
      branchName={branch?.name ?? "No active branch"}
      currency={organization.currency_code.trim()}
      organizationName={organization.name}
      timezone={branch?.timezone ?? organization.timezone}
    />
  );
}
