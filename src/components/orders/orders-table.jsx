"use client";

import { useEffect, useState } from "react";

const statuses = ["Delivered", "Processing", "Cancelled"];

const statusStyles = {
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Processing: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function isOrdersApiResponse(value) {
  if (typeof value !== "object" || value === null) return false;

  return (
    Array.isArray(value.data) &&
    value.data.every(
      (order) =>
        typeof order.id === "string" &&
        typeof order.customer === "string" &&
        typeof order.email === "string" &&
        typeof order.date === "string" &&
        typeof order.amount === "number" &&
        statuses.includes(order.status),
    ) &&
    typeof value.pagination === "object" &&
    value.pagination !== null &&
    Number.isInteger(value.pagination.page) &&
    Number.isInteger(value.pagination.pageSize) &&
    Number.isInteger(value.pagination.total) &&
    Number.isInteger(value.pagination.totalPages) &&
    typeof value.summary === "object" &&
    value.summary !== null &&
    Number.isInteger(value.summary.totalOrders) &&
    Number.isInteger(value.summary.processingOrders) &&
    typeof value.summary.revenue === "number"
  );
}

function apiErrorMessage(value) {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return null;
  }

  const error = value.error;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return null;
}

export function OrdersTable({ onSummaryChange }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [requestId, setRequestId] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      search,
      status,
      sortBy,
      sortOrder,
      page: String(page),
      pageSize: String(pageSize),
    });

    async function loadOrders() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/orders?${params}`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            apiErrorMessage(payload) ??
              `Unable to load orders (HTTP ${response.status}).`,
          );
        }

        if (!isOrdersApiResponse(payload)) {
          throw new Error("The orders service returned an invalid response.");
        }

        setResult(payload);
        onSummaryChange(payload.summary);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load orders. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadOrders();
    return () => controller.abort();
  }, [search, status, sortBy, sortOrder, page, pageSize, requestId, onSummaryChange]);

  const orders = result?.data ?? [];
  const pagination = result?.pagination;
  const firstItem = pagination?.total
    ? (pagination.page - 1) * pagination.pageSize + 1
    : 0;
  const lastItem = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.total)
    : 0;

  return (
    <section
      aria-label="Orders"
      aria-busy={loading}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Recent orders
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Search and refine your orders.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {pagination ? `${pagination.total.toLocaleString("en-IN")} orders` : "— orders"}
        </span>
      </div>

      <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_180px_170px_auto]">
        <label className="block">
          <span className="sr-only">Search orders</span>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setPage(1);
            }}
            placeholder="Search order, customer, or email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <label className="block">
          <span className="sr-only">Filter by status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">All statuses</option>
            <option value="Delivered">Delivered</option>
            <option value="Processing">Processing</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Sort orders by</span>
          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="date">Sort: Date</option>
            <option value="id">Sort: Order ID</option>
            <option value="customer">Sort: Customer</option>
            <option value="amount">Sort: Amount</option>
            <option value="status">Sort: Status</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => setSortOrder((current) => current === "asc" ? "desc" : "asc")}
          aria-label={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}; click to reverse`}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {sortOrder === "asc" ? "Ascending ↑" : "Descending ↓"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-800"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setRequestId((current) => current + 1)}
            className="font-semibold underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {loading && (
        <p role="status" className="border-b border-slate-100 px-5 py-2 text-xs text-slate-500">
          {result ? "Updating orders…" : "Loading orders…"}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Order</th>
              <th scope="col" className="px-5 py-3 font-medium">Customer</th>
              <th scope="col" className="px-5 py-3 font-medium">Date</th>
              <th scope="col" className="px-5 py-3 font-medium">Amount</th>
              <th scope="col" className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id} className="text-slate-700">
                <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                  {order.id}
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  <p className="font-medium text-slate-800">{order.customer}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{order.email}</p>
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  {dateFormatter.format(new Date(order.date))}
                </td>
                <td className="whitespace-nowrap px-5 py-4 font-medium">
                  {currency.format(order.amount)}
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[order.status]}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                  {error ? "Orders could not be loaded." : "No orders match these filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>
            {pagination
              ? `Showing ${firstItem.toLocaleString("en-IN")}–${lastItem.toLocaleString("en-IN")} of ${pagination.total.toLocaleString("en-IN")}`
              : "Waiting for results"}
          </span>
          <label>
            <span className="sr-only">Orders per page</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {Math.max(pagination?.totalPages ?? 0, 1)}
          </span>
          <button
            type="button"
            disabled={!pagination || page >= pagination.totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
