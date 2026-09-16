import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { SubmitButton } from "@/components/submit-button";

type SignupPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { message } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f9] px-4 py-10 text-[#172026]">
      <section className="w-full max-w-md rounded-md border border-[#dfe3e8] bg-white p-6">
        <div className="mb-6">
          <div className="mb-4 grid size-11 place-items-center rounded-md bg-[#0b5c5a] text-sm font-bold text-white">
            AM
          </div>
          <h1 className="text-2xl font-semibold">Create your POS account</h1>
          <p className="mt-2 text-sm text-[#697680]">
            Start with one branch today. Add products, stock, and registers next.
          </p>
        </div>

        {message ? (
          <p className="mb-4 rounded-md border border-[#ffd8a8] bg-[#fff8ef] p-3 text-sm text-[#8a5300]">
            {message}
          </p>
        ) : null}

        <form action={signUp} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#cfd6dd] px-3 text-sm outline-none focus:border-[#0b5c5a]"
              name="email"
              placeholder="owner@example.com"
              required
              type="email"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#cfd6dd] px-3 text-sm outline-none focus:border-[#0b5c5a]"
              minLength={6}
              name="password"
              required
              type="password"
            />
          </label>
          <SubmitButton
            className="h-11 w-full rounded-md bg-[#0b5c5a] text-sm font-semibold text-white"
            pendingLabel="Creating account..."
          >
            Create account
          </SubmitButton>
        </form>

        <p className="mt-5 text-sm text-[#697680]">
          Already have an account?{" "}
          <Link className="font-semibold text-[#0b5c5a]" href="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
