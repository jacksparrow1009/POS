"use client";

import { useActionState } from "react";
import {
  Building2,
  CheckCircle2,
  Globe,
  ReceiptText,
  Save,
  Store,
} from "lucide-react";
import { updateStoreSettings } from "@/app/settings/actions";
import { SubmitButton } from "@/components/submit-button";

export function SettingsForm({
  initialOrg,
  initialBranch,
}: {
  initialOrg: {
    name: string;
    slug: string;
    currencyCode: string;
    timezone: string;
  };
  initialBranch: {
    name: string;
    code: string;
  } | null;
}) {
  const [state, formAction] = useActionState(updateStoreSettings, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-warning/25 bg-warning-soft p-3.5 text-sm text-warning"
        >
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-md bg-success-soft p-3.5 text-sm font-medium text-success"
        >
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{state.success}</span>
        </p>
      ) : null}

      {/* Business Profile */}
      <div className="rounded-md border border-border bg-surface p-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Store size={16} className="text-brand shrink-0" />
          <h2 className="text-sm font-semibold">Business profile</h2>
        </div>

        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-muted-strong uppercase tracking-wider">
              Store / Business name <span className="text-danger">*</span>
            </span>
            <input
              name="organizationName"
              defaultValue={initialOrg.name}
              required
              className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Store URL slug (permanent)
            </span>
            <input
              value={initialOrg.slug}
              disabled
              className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface-subtle px-3 text-sm text-muted font-mono"
            />
          </label>
        </div>
      </div>

      {/* Primary Branch Details */}
      <div className="rounded-md border border-border bg-surface p-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Building2 size={16} className="text-brand shrink-0" />
          <h2 className="text-sm font-semibold">Primary counter branch</h2>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-muted-strong uppercase tracking-wider">
              Branch name <span className="text-danger">*</span>
            </span>
            <input
              name="branchName"
              defaultValue={initialBranch?.name ?? "Main Branch"}
              required
              className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-muted-strong uppercase tracking-wider">
              Branch code <span className="text-danger">*</span>
            </span>
            <input
              name="branchCode"
              defaultValue={initialBranch?.code ?? "MB1"}
              required
              maxLength={12}
              className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono uppercase outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </label>
        </div>
      </div>

      {/* Regional & Financial Settings */}
      <div className="rounded-md border border-border bg-surface p-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Globe size={16} className="text-brand shrink-0" />
          <h2 className="text-sm font-semibold">Currency &amp; Localization</h2>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-muted-strong uppercase tracking-wider">
              Store currency
            </span>
            <select
              name="currencyCode"
              defaultValue={initialOrg.currencyCode}
              className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="PKR">PKR (Pakistani Rupee - Rs.)</option>
              <option value="USD">USD (US Dollar - $)</option>
              <option value="AED">AED (UAE Dirham)</option>
              <option value="SAR">SAR (Saudi Riyal)</option>
              <option value="GBP">GBP (British Pound - £)</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-muted-strong uppercase tracking-wider">
              Timezone
            </span>
            <select
              name="timezone"
              defaultValue={initialOrg.timezone}
              className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="Asia/Karachi">Asia/Karachi (Pakistan Standard Time)</option>
              <option value="Asia/Dubai">Asia/Dubai (Gulf Standard Time)</option>
              <option value="Asia/Riyadh">Asia/Riyadh (Arabia Standard Time)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
            </select>
          </label>
        </div>
      </div>

      {/* Pakistani Tax Compliance & Fiscalization */}
      <div className="rounded-md border border-border bg-surface p-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <ReceiptText size={16} className="text-brand shrink-0" />
          <h2 className="text-sm font-semibold">Tax &amp; Fiscal Invoicing (FBR / PRA / SRB)</h2>
        </div>
        <p className="mt-2 text-xs text-muted leading-relaxed">
          Optional tax identifiers for sales receipt headers and Tier-1 reporting compliance.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-muted-strong uppercase tracking-wider">
              National Tax Number (NTN)
            </span>
            <input
              name="ntn"
              placeholder="e.g. 1234567-8"
              defaultValue=""
              className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-muted-strong uppercase tracking-wider">
              Sales Tax Reg. Number (STRN)
            </span>
            <input
              name="strn"
              placeholder="e.g. 03-00-1234-567-89"
              defaultValue=""
              className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-3">
        <SubmitButton
          pendingLabel="Saving settings..."
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-6 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-hover"
        >
          <Save size={16} className="shrink-0" />
          <span>Save store settings</span>
        </SubmitButton>
      </div>
    </form>
  );
}
