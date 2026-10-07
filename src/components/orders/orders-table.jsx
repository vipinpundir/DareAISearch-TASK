"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

const statuses = ["Delivered", "Processing", "Cancelled"];
const sortFields = ["id", "customer", "date", "amount", "status"];
const rowHeight = 72;
const headerHeight = 40;
const viewportHeight = 520;
const overscan = 5;

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

const OrderRow = memo(function OrderRow({ order, index, detailHref, onOpenOrder }) {
  return (
    <tr
      aria-rowindex={index + 2}
      className="h-[72px] text-slate-700"
      style={{ height: rowHeight }}
    >
      <th
        scope="row"
        className="whitespace-nowrap px-5 py-0 text-left font-medium text-slate-900"
      >
        <a
          href={detailHref}
          data-order-link={order.id}
          onClick={(event) => {
            if (
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            ) {
              return;
            }
            event.preventDefault();
            onOpenOrder(order.id, detailHref, event.currentTarget);
          }}
          className="rounded text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          {order.id}
        </a>
      </th>
      <td className="whitespace-nowrap px-5 py-0">
        <p className="font-medium text-slate-800">{order.customer}</p>
        <p className="mt-0.5 text-xs text-slate-500">{order.email}</p>
      </td>
      <td className="whitespace-nowrap px-5 py-0">
        {dateFormatter.format(new Date(order.date))}
      </td>
      <td className="whitespace-nowrap px-5 py-0 font-medium">
        {currency.format(order.amount)}
      </td>
      <td className="whitespace-nowrap px-5 py-0">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[order.status]}`}
        >
          {order.status}
        </span>
      </td>
    </tr>
  );
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
        Number.isFinite(order.amount) &&
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
    Number.isFinite(value.summary.revenue)
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

function readExplorerState(params) {
  const requestedStatus = params.get("status") ?? "all";
  const requestedSort = params.get("sortBy") ?? "date";
  const requestedDirection = params.get("sortOrder") ?? "desc";
  const requestedPageSize = Number(params.get("pageSize") ?? 10);
  const requestedPage = Number(params.get("page") ?? 1);

  return {
    search: (params.get("search") ?? "").slice(0, 100),
    status: statuses.includes(requestedStatus) ? requestedStatus : "all",
    sortBy: sortFields.includes(requestedSort) ? requestedSort : "date",
    sortOrder: requestedDirection === "asc" ? "asc" : "desc",
    page:
      Number.isSafeInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1,
    pageSize: [10, 25, 50, 100].includes(requestedPageSize)
      ? requestedPageSize
      : 10,
  };
}

function writeExplorerState(state) {
  const params = new URLSearchParams();
  if (state.search) params.set("search", state.search);
  if (state.status !== "all") params.set("status", state.status);
  if (state.sortBy !== "date") params.set("sortBy", state.sortBy);
  if (state.sortOrder !== "desc") params.set("sortOrder", state.sortOrder);
  if (state.page !== 1) params.set("page", String(state.page));
  if (state.pageSize !== 10) params.set("pageSize", String(state.pageSize));

  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` === url) {
    return false;
  }

  window.history.pushState(null, "", url);
  return true;
}

function VirtualizedRows({
  orders,
  scrollTop,
  total,
  page,
  pageSize,
  error,
  createDetailHref,
  onOpenOrder,
}) {
  const visibleCount = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
  const firstVisible = Math.max(
    0,
    Math.floor(Math.max(0, scrollTop - headerHeight) / rowHeight) - overscan,
  );
  const lastVisible = Math.min(orders.length, firstVisible + visibleCount);
  const visibleOrders = orders.slice(firstVisible, lastVisible);
  const topSpace = firstVisible * rowHeight;
  const bottomSpace = (orders.length - lastVisible) * rowHeight;

  return (
    <tbody className="divide-y divide-slate-100">
      {topSpace > 0 && (
        <tr aria-hidden="true" role="presentation">
          <td
            colSpan={5}
            className="p-0"
            style={{ height: topSpace }}
          />
        </tr>
      )}
      {visibleOrders.map((order, offset) => (
        <OrderRow
          key={order.id}
          order={order}
          index={(page - 1) * pageSize + firstVisible + offset}
          detailHref={createDetailHref(order.id)}
          onOpenOrder={onOpenOrder}
        />
      ))}
      {bottomSpace > 0 && (
        <tr aria-hidden="true" role="presentation">
          <td
            colSpan={5}
            className="p-0"
            style={{ height: bottomSpace }}
          />
        </tr>
      )}
      {orders.length === 0 && total === 0 && (
        <tr>
          <td colSpan={5} className="px-5 py-12 text-center">
            {error ? (
              <p className="text-sm text-slate-600">
                Results are unavailable. Retry the request to load orders.
              </p>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-800">
                  No orders found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Try another search or clear the current filters.
                </p>
              </>
            )}
          </td>
        </tr>
      )}
    </tbody>
  );
}

export function OrdersTable({ onSummaryChange, onOpenOrder }) {
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const explorer = useMemo(
    () => readExplorerState(new URLSearchParams(paramsKey)),
    [paramsKey],
  );
  const [searchInput, setSearchInput] = useState(explorer.search);
  const [requestId, setRequestId] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const activeRequestRef = useRef(null);

  const beginRequest = useCallback(() => {
    requestSequenceRef.current += 1;
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    setLoading(true);
    setError(null);
    setResult(null);
    setScrollTop(0);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, []);

  useEffect(() => {
    function restoreSearchFromUrl() {
      const nextState = readExplorerState(
        new URLSearchParams(window.location.search),
      );
      setSearchInput(nextState.search);
      const listStateChanged =
        nextState.search !== explorer.search ||
        nextState.status !== explorer.status ||
        nextState.sortBy !== explorer.sortBy ||
        nextState.sortOrder !== explorer.sortOrder ||
        nextState.page !== explorer.page ||
        nextState.pageSize !== explorer.pageSize;
      if (listStateChanged) beginRequest();
    }

    window.addEventListener("popstate", restoreSearchFromUrl);
    return () => window.removeEventListener("popstate", restoreSearchFromUrl);
  }, [beginRequest, explorer]);

  useEffect(() => {
    if (searchInput.trim() === explorer.search) return undefined;

    const timeout = window.setTimeout(() => {
      beginRequest();
      writeExplorerState({ ...explorer, search: searchInput.trim(), page: 1 });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput, explorer, beginRequest]);

  useEffect(() => {
    const sequence = ++requestSequenceRef.current;
    const controller = new AbortController();
    activeRequestRef.current = controller;
    const params = new URLSearchParams({
      search: explorer.search,
      status: explorer.status,
      sortBy: explorer.sortBy,
      sortOrder: explorer.sortOrder,
      page: String(explorer.page),
      pageSize: String(explorer.pageSize),
    });
    let active = true;

    async function loadOrders() {
      try {
        const response = await fetch(`/api/orders?${params}`, {
          signal: controller.signal,
          cache: "no-store",
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
        if (!active || sequence !== requestSequenceRef.current) return;

        setResult(payload);
        onSummaryChange(payload.summary);
      } catch (requestError) {
        if (
          !active ||
          controller.signal.aborted ||
          sequence !== requestSequenceRef.current
        ) {
          return;
        }
        setResult(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load orders. Please try again.",
        );
      } finally {
        if (active && sequence === requestSequenceRef.current) {
          setLoading(false);
        }
      }
    }

    void loadOrders();
    return () => {
      active = false;
      controller.abort();
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
      }
    };
  }, [
    explorer.search,
    explorer.status,
    explorer.sortBy,
    explorer.sortOrder,
    explorer.page,
    explorer.pageSize,
    requestId,
    onSummaryChange,
  ]);

  useEffect(
    () => () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    },
    [],
  );

  const updateExplorer = useCallback(
    (changes) => {
      const changed = writeExplorerState({
        ...explorer,
        search: searchInput.trim(),
        ...changes,
      });
      if (changed) beginRequest();
    },
    [explorer, searchInput, beginRequest],
  );

  const createDetailHref = useCallback(
    (orderId) => {
      const detailParams = new URLSearchParams(paramsKey);
      const currentSearch = searchInput.trim();
      if (currentSearch) detailParams.set("search", currentSearch);
      else detailParams.delete("search");
      detailParams.set("order", orderId);
      return `/orders?${detailParams.toString()}`;
    },
    [paramsKey, searchInput],
  );

  const handleScroll = useCallback((event) => {
    const nextScrollTop = event.currentTarget.scrollTop;
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      setScrollTop(nextScrollTop);
      scrollFrameRef.current = null;
    });
  }, []);

  const handleSearchChange = useCallback(
    (event) => {
      beginRequest();
      setSearchInput(event.target.value);
    },
    [beginRequest],
  );

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
        <span
          aria-live="polite"
          aria-atomic="true"
          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
        >
          {pagination
            ? `${pagination.total.toLocaleString("en-IN")} orders`
            : "— orders"}
        </span>
      </div>

      <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_180px_170px_auto]">
        <label className="block">
          <span className="sr-only">Search orders</span>
          <input
            type="search"
            value={searchInput}
            maxLength={100}
            onChange={handleSearchChange}
            placeholder="Search order, customer, or email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <label className="block">
          <span className="sr-only">Filter by status</span>
          <select
            value={explorer.status}
            onChange={(event) =>
              updateExplorer({ status: event.target.value, page: 1 })
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Sort orders by</span>
          <select
            value={explorer.sortBy}
            onChange={(event) =>
              updateExplorer({ sortBy: event.target.value, page: 1 })
            }
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
          onClick={() =>
            updateExplorer({
              sortOrder: explorer.sortOrder === "asc" ? "desc" : "asc",
              page: 1,
            })
          }
          aria-label={`Change sort direction from ${explorer.sortOrder === "asc" ? "ascending" : "descending"}`}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          {explorer.sortOrder === "asc" ? "Ascending ↑" : "Descending ↓"}
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
            onClick={() => {
              beginRequest();
              setRequestId((current) => current + 1);
            }}
            className="rounded font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {loading && (
        <p
          role="status"
          aria-live="polite"
          className="border-b border-slate-100 px-5 py-2 text-xs text-slate-500"
        >
          {result ? "Updating orders…" : "Loading orders…"}
        </p>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        role="region"
        aria-label="Order results"
        tabIndex={0}
        className="h-[520px] overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
      >
        <table
          aria-rowcount={pagination ? pagination.total + 1 : undefined}
          aria-busy={loading}
          aria-colcount={5}
          className="w-full min-w-[720px] table-fixed text-left text-sm"
        >
          <caption className="sr-only">
            Orders matching the current search and filters
          </caption>
          <thead className="sticky top-0 z-10 h-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="w-[16%] px-5 py-3 font-medium">Order</th>
              <th scope="col" className="w-[32%] px-5 py-3 font-medium">Customer</th>
              <th scope="col" className="w-[18%] px-5 py-3 font-medium">Date</th>
              <th scope="col" className="w-[18%] px-5 py-3 font-medium">Amount</th>
              <th scope="col" className="w-[16%] px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          {loading && !result ? (
            <tbody aria-label="Loading orders">
              {Array.from({ length: 7 }, (_, index) => (
                <tr
                  key={`loading-${index}`}
                  aria-hidden="true"
                  className="h-[72px]"
                >
                  {Array.from({ length: 5 }, (_, cellIndex) => (
                    <td key={cellIndex} className="px-5 py-0">
                      <span className="block h-3 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ) : (
            <VirtualizedRows
              orders={orders}
              scrollTop={scrollTop}
              total={pagination?.total ?? 0}
              page={pagination?.page ?? explorer.page}
              pageSize={pagination?.pageSize ?? explorer.pageSize}
              error={error}
              createDetailHref={createDetailHref}
              onOpenOrder={onOpenOrder}
            />
          )}
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span aria-live="polite" aria-atomic="true">
            {pagination
              ? `Showing ${firstItem.toLocaleString("en-IN")}–${lastItem.toLocaleString("en-IN")} of ${pagination.total.toLocaleString("en-IN")}`
              : loading
                ? "Loading results"
                : "Results unavailable"}
          </span>
          <label>
            <span className="sr-only">Orders per page</span>
            <select
              value={explorer.pageSize}
              onChange={(event) =>
                updateExplorer({
                  pageSize: Number(event.target.value),
                  page: 1,
                })
              }
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </label>
        </div>
        <nav aria-label="Orders pagination" className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading || explorer.page <= 1}
            onClick={() => updateExplorer({ page: explorer.page - 1 })}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {explorer.page} of {Math.max(pagination?.totalPages ?? 0, 1)}
          </span>
          <button
            type="button"
            disabled={
              loading ||
              !pagination ||
              explorer.page >= pagination.totalPages
            }
            onClick={() => updateExplorer({ page: explorer.page + 1 })}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </nav>
      </div>
    </section>
  );
}
