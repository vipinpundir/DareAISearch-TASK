function SummaryCard({ label, value, note }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{note}</p>
    </article>
  );
}

export function OrdersSummary({ summary }) {
  const count = new Intl.NumberFormat("en-IN");
  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  return (
    <section
      aria-label="Order summary"
      className="mb-6 grid gap-4 sm:grid-cols-3"
    >
      <SummaryCard
        label="Total orders"
        value={summary ? count.format(summary.totalOrders) : "—"}
        note="Orders in the mock dataset"
      />
      <SummaryCard
        label="Processing"
        value={summary ? count.format(summary.processingOrders) : "—"}
        note="Awaiting fulfillment"
      />
      <SummaryCard
        label="Revenue"
        value={summary ? currency.format(summary.revenue) : "—"}
        note="Across all mock orders"
      />
    </section>
  );
}
