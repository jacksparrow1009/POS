import { SettingsForm } from "@/app/settings/settings-form";
import { getCurrentWorkspace } from "@/lib/workspace";

export default async function SettingsPage() {
  const { organization, branch } = await getCurrentWorkspace();

  return (
    <section className="min-w-0">
      <header className="flex min-h-24 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-5 py-5 lg:px-8">
        <div>
          <p className="text-xs font-medium text-muted">Workspace settings</p>
          <h1 className="mt-1 text-2xl font-semibold">Store and branch</h1>
          <p className="mt-1 text-sm text-muted">Manage the details used across registers, receipts, and reports.</p>
        </div>
      </header>

      <div className="p-5 lg:p-8">
        <SettingsForm
          initialOrg={{
            name: organization.name,
            slug: organization.slug,
            currencyCode: organization.currency_code.trim(),
            timezone: organization.timezone,
          }}
          initialBranch={
            branch
              ? {
                  name: branch.name,
                  code: branch.code,
                }
              : null
          }
        />
      </div>
    </section>
  );
}
