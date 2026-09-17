import { createWorkspace } from "@/app/auth/actions";
import { SubmitButton } from "@/components/submit-button";
import { Check, Store } from "lucide-react";

type OnboardingPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const { message } = await searchParams;

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-md border border-border bg-surface-subtle p-7">
          <div className="mb-6 grid size-10 place-items-center rounded-md bg-brand text-white">
            <Store aria-hidden="true" size={19} />
          </div>
          <p className="text-xs font-semibold uppercase text-muted">Workspace setup</p>
          <h1 className="mt-1 text-xl font-semibold">Set up your first store</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            This creates the organization, owner role, your membership, first
            branch, and starter trial record in one secure database call.
          </p>

          <div className="mt-8 space-y-4">
            {[
              "Organization and owner role",
              "First branch with local timezone",
              "Starter subscription trial",
              "Tenant-scoped RLS access",
            ].map((item) => (
              <div className="flex items-center gap-3" key={item}>
                <span className="grid size-5 place-items-center rounded-full bg-brand-soft text-brand"><Check aria-hidden="true" size={13} /></span>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-border bg-surface p-7 shadow-sm">
          <h2 className="text-base font-semibold">Business details</h2>
          <p className="mt-1 text-sm text-muted">
            You can add more branches and employees after setup.
          </p>

          {message ? (
            <p className="mt-4 rounded-md border border-danger/20 bg-danger-soft p-3 text-sm text-danger">
              {message}
            </p>
          ) : null}

          <form action={createWorkspace} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium">Business name</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                defaultValue="Awan Mart"
                name="organizationName"
                required
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium">Business slug</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                defaultValue="awan-mart"
                name="organizationSlug"
                pattern="[a-z0-9-]+"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">First branch</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                defaultValue="Gulberg Branch"
                name="branchName"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Branch code</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm uppercase outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                defaultValue="GLB"
                maxLength={12}
                name="branchCode"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Currency</span>
              <select
                className="mt-2 h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                defaultValue="PKR"
                name="currencyCode"
              >
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
                <option value="AED">AED</option>
                <option value="GBP">GBP</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">Timezone</span>
              <select
                className="mt-2 h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                defaultValue="Asia/Karachi"
                name="timezone"
              >
                <option value="Asia/Karachi">Asia/Karachi</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </label>

            <SubmitButton
              className="mt-2 h-11 rounded-md bg-brand text-sm font-semibold text-white hover:bg-brand-hover md:col-span-2"
              pendingLabel="Creating workspace..."
            >
              Create workspace
            </SubmitButton>
          </form>
        </section>
      </div>
    </main>
  );
}
