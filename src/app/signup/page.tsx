import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { SubmitButton } from "@/components/submit-button";
import { Store } from "lucide-react";

type SignupPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { message } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-md rounded-md border border-border bg-surface p-7 shadow-sm">
        <div className="mb-6">
          <div className="mb-5 grid size-10 place-items-center rounded-md bg-brand text-white">
            <Store aria-hidden="true" size={19} />
          </div>
          <p className="text-xs font-semibold uppercase text-muted">Awan POS</p>
          <h1 className="mt-1 text-xl font-semibold">Create your account</h1>
          <p className="mt-2 text-sm text-muted">
            Start with one branch today. Add products, stock, and registers next.
          </p>
        </div>

        {message ? (
          <p className="mb-4 rounded-md border border-danger/20 bg-danger-soft p-3 text-sm text-danger">
            {message}
          </p>
        ) : null}

        <form action={signUp} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/10"
              name="email"
              placeholder="owner@example.com"
              required
              type="email"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              minLength={6}
              name="password"
              required
              type="password"
            />
          </label>
          <SubmitButton
            className="h-11 w-full rounded-md bg-brand text-sm font-semibold text-white hover:bg-brand-hover"
            pendingLabel="Creating account..."
          >
            Create account
          </SubmitButton>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link className="font-semibold text-brand hover:text-brand-hover" href="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
