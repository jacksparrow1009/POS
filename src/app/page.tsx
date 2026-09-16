import {
  activity,
  cart,
  metrics,
  navItems,
  products,
  setupSteps,
} from "@/lib/pos-demo-data";
import { signOut } from "@/app/auth/actions";
import { SubmitButton } from "@/components/submit-button";
import { getCurrentWorkspace } from "@/lib/workspace";

export default async function Home() {
  const { organization, branch } = await getCurrentWorkspace();
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const discount = 320;
  const tax = 218;
  const total = subtotal - discount + tax;
  const initials = organization.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const activeBranchName = branch?.name ?? "No active branch";

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#172026]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[244px_1fr]">
        <aside className="border-r border-[#dfe3e8] bg-white px-4 py-5">
          <div className="mb-7 flex items-center gap-3 px-2">
            <div className="grid size-10 place-items-center rounded-md bg-[#0b5c5a] text-sm font-bold text-white">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold">{organization.name}</p>
              <p className="text-xs text-[#697680]">Retail POS SaaS</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                className={`flex h-10 w-full items-center rounded-md px-3 text-left text-sm font-medium ${
                  item === "Dashboard"
                    ? "bg-[#e6f2ef] text-[#0b5c5a]"
                    : "text-[#53606b] hover:bg-[#f1f3f5]"
                }`}
                key={item}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-md border border-[#dfe3e8] bg-[#fbfcfc] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#697680]">
              Active branch
            </p>
            <p className="mt-2 text-sm font-semibold">{activeBranchName}</p>
            <p className="mt-1 text-xs text-[#697680]">
              {branch?.timezone ?? organization.timezone} / {organization.currency_code}
            </p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="flex flex-col gap-4 border-b border-[#dfe3e8] bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#697680]">
                Thursday, September 17
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal">
                Store operations
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={signOut}>
                <SubmitButton
                  className="h-10 rounded-md border border-[#cfd6dd] bg-white px-4 text-sm font-semibold"
                  pendingLabel="Signing out..."
                >
                  Sign out
                </SubmitButton>
              </form>
              <button className="h-10 rounded-md border border-[#cfd6dd] bg-white px-4 text-sm font-semibold">
                Import products
              </button>
              <button className="h-10 rounded-md bg-[#0b5c5a] px-4 text-sm font-semibold text-white">
                Open POS
              </button>
            </div>
          </header>

          <div className="grid gap-5 p-5 xl:grid-cols-[1fr_420px]">
            <section className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                  <article
                    className="rounded-md border border-[#dfe3e8] bg-white p-4"
                    key={metric.label}
                  >
                    <p className="text-sm text-[#697680]">{metric.label}</p>
                    <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
                    <p className="mt-2 text-xs font-medium text-[#0b5c5a]">
                      {metric.delta}
                    </p>
                  </article>
                ))}
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <article className="rounded-md border border-[#dfe3e8] bg-white">
                  <div className="border-b border-[#edf0f2] p-4">
                    <h2 className="text-base font-semibold">Inventory watch</h2>
                    <p className="mt-1 text-sm text-[#697680]">
                      Stock is tracked per branch and product variant.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className="bg-[#f7f8f9] text-xs uppercase text-[#697680]">
                        <tr>
                          <th className="px-4 py-3">SKU</th>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">Branch</th>
                          <th className="px-4 py-3">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr className="border-t border-[#edf0f2]" key={product.sku}>
                            <td className="px-4 py-3 font-mono text-xs">
                              {product.sku}
                            </td>
                            <td className="px-4 py-3 font-medium">{product.name}</td>
                            <td className="px-4 py-3 text-[#53606b]">
                              {product.branch}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded px-2 py-1 text-xs font-semibold ${
                                  product.stock <= product.alert
                                    ? "bg-[#fff1df] text-[#935400]"
                                    : "bg-[#e8f4ee] text-[#0f6848]"
                                }`}
                              >
                                {product.stock} on hand
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="rounded-md border border-[#dfe3e8] bg-white p-4">
                  <h2 className="text-base font-semibold">Setup progress</h2>
                  <div className="mt-4 space-y-3">
                    {setupSteps.map(({ label, done }) => (
                      <div className="flex items-center gap-3" key={String(label)}>
                        <span
                          className={`size-3 rounded-full ${
                            done ? "bg-[#0b5c5a]" : "bg-[#ccd3d9]"
                          }`}
                        />
                        <span className="text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <article className="rounded-md border border-[#dfe3e8] bg-white p-4">
                <h2 className="text-base font-semibold">Recent activity</h2>
                <div className="mt-3 divide-y divide-[#edf0f2]">
                  {activity.map((item) => (
                    <p className="py-3 text-sm text-[#53606b]" key={item}>
                      {item}
                    </p>
                  ))}
                </div>
              </article>
            </section>

            <aside className="rounded-md border border-[#dfe3e8] bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">POS register</h2>
                  <p className="mt-1 text-sm text-[#697680]">Shift 02 / Counter 1</p>
                </div>
                <span className="rounded bg-[#e8f4ee] px-2 py-1 text-xs font-semibold text-[#0f6848]">
                  Open
                </span>
              </div>

              <label className="mt-5 block">
                <span className="text-xs font-semibold uppercase text-[#697680]">
                  Barcode or search
                </span>
                <input
                  className="mt-2 h-11 w-full rounded-md border border-[#cfd6dd] px-3 text-sm outline-none focus:border-[#0b5c5a]"
                  placeholder="Scan barcode or type product name"
                />
              </label>

              <div className="mt-5 space-y-3">
                {cart.map((item) => (
                  <div
                    className="flex items-center justify-between rounded-md border border-[#edf0f2] p-3"
                    key={item.name}
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="mt-1 text-xs text-[#697680]">Qty {item.qty}</p>
                    </div>
                    <p className="text-sm font-semibold">
                      PKR {item.price.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2 border-t border-[#edf0f2] pt-4 text-sm">
                <div className="flex justify-between text-[#53606b]">
                  <span>Subtotal</span>
                  <span>PKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#53606b]">
                  <span>Discount</span>
                  <span>-PKR {discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#53606b]">
                  <span>Tax</span>
                  <span>PKR {tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-3 text-lg font-semibold">
                  <span>Total</span>
                  <span>PKR {total.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {["Cash", "Card", "Bank"].map((method) => (
                  <button
                    className="h-10 rounded-md border border-[#cfd6dd] text-sm font-semibold"
                    key={method}
                  >
                    {method}
                  </button>
                ))}
              </div>
              <button className="mt-3 h-11 w-full rounded-md bg-[#0b5c5a] text-sm font-semibold text-white">
                Complete sale
              </button>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
