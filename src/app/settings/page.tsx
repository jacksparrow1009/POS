import { SettingsForm } from "@/app/settings/settings-form";
import { getCurrentWorkspace } from "@/lib/workspace";

export default async function SettingsPage() {
  const { organization, branch } = await getCurrentWorkspace();

  return (
    <section className="min-w-0">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase text-muted">Configuration</p>
          <h1 className="mt-1 text-xl font-semibold">Store &amp; Branch Settings</h1>
        </div>
      </header>

      <div className="p-5 lg:p-6">
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
