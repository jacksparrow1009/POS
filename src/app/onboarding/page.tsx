import { createWorkspace } from "@/app/auth/actions";
import { SubmitButton } from "@/components/submit-button";

type OnboardingPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const { message } = await searchParams;

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-8 text-[#172026]">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-md border border-[#dfe3e8] bg-white p-6">
          <div className="mb-6 grid size-11 place-items-center rounded-md bg-[#0b5c5a] text-sm font-bold text-white">
            AM
          </div>
          <h1 className="text-2xl font-semibold">Set up your first store</h1>
          <p className="mt-3 text-sm leading-6 text-[#697680]">
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
                <span className="size-3 rounded-full bg-[#0b5c5a]" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-[#dfe3e8] bg-white p-6">
          <h2 className="text-lg font-semibold">Business details</h2>
          <p className="mt-1 text-sm text-[#697680]">
            You can add more branches and employees after setup.
          </p>

          {message ? (
            <p className="mt-4 rounded-md border border-[#ffd8a8] bg-[#fff8ef] p-3 text-sm text-[#8a5300]">
              {message}
            </p>
          ) : null}

          <form action={createWorkspace} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium">Business name</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#cfd6dd] px-3 text-sm outline-none focus:border-[#0b5c5a]"
                defaultValue="Awan Mart"
                name="organizationName"
                required
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium">Business slug</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#cfd6dd] px-3 text-sm outline-none focus:border-[#0b5c5a]"
                defaultValue="awan-mart"
                name="organizationSlug"
                pattern="[a-z0-9-]+"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">First branch</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#cfd6dd] px-3 text-sm outline-none focus:border-[#0b5c5a]"
                defaultValue="Gulberg Branch"
                name="branchName"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Branch code</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#cfd6dd] px-3 text-sm uppercase outline-none focus:border-[#0b5c5a]"
                defaultValue="GLB"
                maxLength={12}
                name="branchCode"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Currency</span>
              <select
                className="mt-2 h-11 w-full rounded-md border border-[#cfd6dd] bg-white px-3 text-sm outline-none focus:border-[#0b5c5a]"
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
                className="mt-2 h-11 w-full rounded-md border border-[#cfd6dd] bg-white px-3 text-sm outline-none focus:border-[#0b5c5a]"
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
              className="mt-2 h-11 rounded-md bg-[#0b5c5a] text-sm font-semibold text-white md:col-span-2"
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
