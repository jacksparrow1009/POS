"use client";

import { useActionState, type ReactNode } from "react";
import { Building2, CheckCircle2, Globe, Save, Store, type LucideIcon } from "lucide-react";
import { updateStoreSettings } from "@/app/settings/actions";
import { SubmitButton } from "@/components/submit-button";

const controlClass =
  "mt-2 h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm outline-none placeholder:text-muted";

export function SettingsForm({ initialOrg, initialBranch }: {
  initialOrg: { name: string; slug: string; currencyCode: string; timezone: string };
  initialBranch: { name: string; code: string } | null;
}) {
  const [state, formAction] = useActionState(updateStoreSettings, { error: null, success: null });

  return (
    <form action={formAction} className="mx-auto max-w-6xl">
      <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6">
          <p className="text-xs font-semibold uppercase text-muted">Settings</p>
          <nav aria-label="Settings sections" className="mt-3 flex gap-1 overflow-x-auto lg:flex-col">
            <SettingsLink href="#business" icon={Store} label="Business profile" />
            <SettingsLink href="#branch" icon={Building2} label="Counter branch" />
            <SettingsLink href="#regional" icon={Globe} label="Regional settings" />
          </nav>
          <p className="mt-5 hidden text-xs leading-5 text-muted lg:block">
            Changes apply across this workspace and its active counter branch.
          </p>
        </aside>

        <div className="overflow-hidden rounded-md border border-border bg-surface shadow-xs">
          {state.error ? (
            <p role="alert" className="m-5 rounded-md border border-warning/25 bg-warning-soft p-3.5 text-sm text-warning">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p role="status" className="m-5 flex items-center gap-2 rounded-md bg-success-soft p-3.5 text-sm font-medium text-success">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{state.success}</span>
            </p>
          ) : null}

          <SettingsSection description="The business name appears throughout the workspace and on customer receipts." icon={Store} id="business" title="Business profile">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.6fr)]">
              <Field label="Business name" required>
                <input name="organizationName" defaultValue={initialOrg.name} required className={controlClass} />
              </Field>
              <Field hint="This identifier cannot be changed." label="Workspace slug">
                <input value={initialOrg.slug} disabled className={`${controlClass} bg-surface-subtle font-mono text-muted`} />
              </Field>
            </div>
          </SettingsSection>

          <SettingsSection description="Used on register screens, inventory records, and branch-level reporting." icon={Building2} id="branch" title="Primary counter branch">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Branch name" required>
                <input name="branchName" defaultValue={initialBranch?.name ?? ""} placeholder="Enter branch name" required className={controlClass} />
              </Field>
              <Field hint="A short code used to identify this location." label="Branch code" required>
                <input name="branchCode" defaultValue={initialBranch?.code ?? ""} placeholder="BR01" required maxLength={12} className={`${controlClass} font-mono uppercase`} />
              </Field>
            </div>
          </SettingsSection>

          <SettingsSection description="Controls money formatting and the local time shown on transactions and reports." icon={Globe} id="regional" title="Currency and localization">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field hint="Changing currency does not convert existing amounts." label="Store currency">
                <select name="currencyCode" defaultValue={initialOrg.currencyCode} className={controlClass}>
                  <option value="PKR">PKR - Pakistani Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </Field>
              <Field label="Timezone">
                <select name="timezone" defaultValue={initialOrg.timezone} className={controlClass}>
                  <option value="Asia/Karachi">Asia/Karachi - Pakistan Standard Time</option>
                  <option value="Asia/Dubai">Asia/Dubai - Gulf Standard Time</option>
                  <option value="Asia/Riyadh">Asia/Riyadh - Arabia Standard Time</option>
                  <option value="Europe/London">Europe/London - GMT/BST</option>
                  <option value="America/New_York">America/New_York - EST/EDT</option>
                </select>
              </Field>
            </div>
          </SettingsSection>

          <div className="flex flex-col gap-3 border-t border-border bg-surface-subtle px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <p className="text-xs text-muted">Required fields are marked with an asterisk.</p>
            <SubmitButton pendingLabel="Saving settings..." className="h-10 w-full rounded-md bg-foreground px-5 text-sm font-semibold text-white shadow-xs hover:bg-brand sm:w-auto">
              <Save size={16} className="shrink-0" />
              <span>Save changes</span>
            </SubmitButton>
          </div>
        </div>
      </div>
    </form>
  );
}

function SettingsLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <a href={href} className="flex h-10 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm font-medium text-muted-strong hover:bg-surface hover:text-foreground">
      <Icon aria-hidden="true" size={16} className="text-muted" />
      {label}
    </a>
  );
}

function SettingsSection({ children, description, icon: Icon, id, title }: { children: ReactNode; description: string; icon: LucideIcon; id: string; title: string }) {
  return (
    <section className="scroll-mt-6 border-b border-border p-5 last:border-b-0 lg:p-6" id={id}>
      <div className="grid gap-5 xl:grid-cols-[230px_minmax(0,1fr)] xl:gap-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-md bg-surface-subtle text-muted-strong"><Icon aria-hidden="true" size={16} /></span>
            <h2 className="text-sm font-semibold">{title}</h2>
          </div>
          <p className="mt-2 max-w-sm text-xs leading-5 text-muted">{description}</p>
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

function Field({ children, hint, label, required = false }: { children: ReactNode; hint?: string; label: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label} {required ? <span className="text-danger">*</span> : null}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs leading-5 text-muted">{hint}</span> : null}
    </label>
  );
}
