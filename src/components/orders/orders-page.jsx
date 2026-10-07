"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OrdersSummary } from "./orders-summary";
import { OrdersTable } from "./orders-table";

const orderStatusStyles = {
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Processing: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export function OrdersPage() {
  const searchParams = useSearchParams();
  const selectedOrderId = searchParams.get("order");
  const returnFocusRef = useRef(null);
  const returnScrollRef = useRef(null);
  const previousOrderIdRef = useRef(selectedOrderId);
  const [summary, setSummary] = useState(null);
  const updateSummary = useCallback((value) => {
    setSummary(value);
  }, []);

  const openOrder = useCallback((orderId, href, trigger) => {
    returnFocusRef.current = { element: trigger, orderId };
    const scrollContainer = trigger.closest('[aria-label="Order results"]');
    returnScrollRef.current = scrollContainer
      ? { element: scrollContainer, top: scrollContainer.scrollTop }
      : null;
    window.history.pushState(null, "", href);
  }, []);

  const closeOrder = useCallback(() => {
    if (returnFocusRef.current) {
      window.history.back();
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.delete("order");
    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", url);
  }, []);

  useEffect(() => {
    if (
      selectedOrderId &&
      previousOrderIdRef.current === null &&
      !returnFocusRef.current
    ) {
      const trigger = document.querySelector(
        `[data-order-link="${CSS.escape(selectedOrderId)}"]`,
      );
      returnFocusRef.current = { element: trigger, orderId: selectedOrderId };
      const scrollContainer = trigger?.closest('[aria-label="Order results"]');
      returnScrollRef.current = scrollContainer
        ? { element: scrollContainer, top: scrollContainer.scrollTop }
        : null;
    }

    previousOrderIdRef.current = selectedOrderId;
  }, [selectedOrderId]);

  return (
    <>
      <main
        id="main-content"
        className="min-h-screen"
        inert={Boolean(selectedOrderId)}
      >
      <a
        href="#orders-heading"
        className="sr-only z-50 rounded-md bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        Skip to orders
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white px-5 py-7 lg:flex">
        <a href="/orders" className="flex items-center gap-3 px-2">
          <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
            D
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            dareai
          </span>
        </a>
        <nav aria-label="Workspace" className="mt-11">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>
          <a
            href="/orders"
            aria-current="page"
            className="flex items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <svg
              aria-hidden="true"
              className="size-4"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                d="M4 3.75h12v12.5H4zM7 7h6M7 10h6M7 13h4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            Orders
          </a>
        </nav>
        <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">Need a hand?</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Your workspace is ready to explore.
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-slate-500">
              <li>Workspace</li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">Orders</li>
            </ol>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">
              Alex Morgan
            </span>
            <span className="grid size-9 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              AM
            </span>
          </div>
        </header>

        <div className="px-5 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <p className="text-sm font-medium text-indigo-600">
                Operations
              </p>
              <h1 id="orders-heading" className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Orders
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Track and manage your recent customer orders.
              </p>
            </div>

            <OrdersSummary summary={summary} />
            <OrdersTable
              onSummaryChange={updateSummary}
              onOpenOrder={openOrder}
            />
          </div>
        </div>
      </div>
      </main>
      {selectedOrderId && (
        <OrderDetailDialog
          key={selectedOrderId}
          orderId={selectedOrderId}
          onClose={closeOrder}
          returnFocusRef={returnFocusRef}
          returnScrollRef={returnScrollRef}
        />
      )}
    </>
  );
}

function OrderDetailDialog({
  orderId,
  onClose,
  returnFocusRef,
  returnScrollRef,
}) {
  const titleRef = useRef(null);
  const dialogRef = useRef(null);
  const [attempt, setAttempt] = useState(0);
  const [detail, setDetail] = useState({
    orderId,
    attempt,
    status: "loading",
    order: null,
    error: null,
  });
  const requestIsCurrent =
    detail.orderId === orderId && detail.attempt === attempt;
  const status = requestIsCurrent ? detail.status : "loading";
  const order = requestIsCurrent ? detail.order : null;
  const error = requestIsCurrent ? detail.error : null;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const params = new URLSearchParams({
      search: orderId,
      sortBy: "id",
      sortOrder: "asc",
      page: "1",
      pageSize: "1",
    });

    async function loadOrder() {
      try {
        const response = await fetch(`/api/orders?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          const message =
            payload &&
            typeof payload === "object" &&
            payload.error &&
            typeof payload.error.message === "string"
              ? payload.error.message
              : `Unable to load order (HTTP ${response.status}).`;
          throw new Error(message);
        }

        if (!active || controller.signal.aborted) return;

        const matchingOrder = payload?.data?.find(
          (candidate) => candidate.id === orderId,
        );
        if (!matchingOrder) {
          setDetail({
            orderId,
            attempt,
            status: "not-found",
            order: null,
            error: null,
          });
          return;
        }

        if (active) {
          setDetail({
            orderId,
            attempt,
            status: "loaded",
            order: matchingOrder,
            error: null,
          });
        }
      } catch (requestError) {
        if (!active || controller.signal.aborted) return;
        setDetail({
          orderId,
          attempt,
          status: "error",
          order: null,
          error:
            requestError instanceof Error
              ? requestError.message
              : "Unable to load order details.",
        });
      }
    }

    void loadOrder();
    return () => {
      active = false;
      controller.abort();
    };
  }, [orderId, attempt]);

  useEffect(() => {
    const previousFocus = returnFocusRef.current;
    titleRef.current?.focus({ preventScroll: true });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const savedScroll = returnScrollRef.current;
    if (savedScroll?.element?.isConnected) {
      savedScroll.element.scrollTop = savedScroll.top;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => {
        if (savedScroll?.element?.isConnected) {
          savedScroll.element.scrollTop = savedScroll.top;
        }
        window.requestAnimationFrame(() => {
          const focusTarget = previousFocus?.element?.isConnected
            ? previousFocus.element
            : previousFocus?.orderId
              ? document.querySelector(
                  `[data-order-link="${CSS.escape(previousFocus.orderId)}"]`,
                )
              : null;
          focusTarget?.focus({ preventScroll: true });
        });
      });
    };
  }, [orderId, returnFocusRef, returnScrollRef]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === titleRef.current)) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  });
  const date = order
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(order.date))
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        aria-describedby="order-detail-description"
        onKeyDown={handleKeyDown}
        className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Order details
            </p>
            <h2
              id="order-detail-title"
              ref={titleRef}
              tabIndex={-1}
              className="mt-1 text-xl font-semibold text-slate-900 focus:outline-none"
            >
              {orderId}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order details"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="size-5"
            >
              <path
                d="m5 5 10 10M15 5 5 15"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.7"
              />
            </svg>
          </button>
        </header>

        <div className="flex-1 px-6 py-6">
          <p id="order-detail-description" className="sr-only">
            Detailed information for order {orderId}.
          </p>
          {status === "loading" && (
            <p role="status" aria-live="polite" className="text-sm text-slate-600">
              Loading order details…
            </p>
          )}
          {status === "error" && (
            <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm text-rose-800">{error}</p>
              <button
                type="button"
                onClick={() => setAttempt((current) => current + 1)}
                className="mt-3 rounded font-semibold text-rose-800 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700"
              >
                Retry
              </button>
            </div>
          )}
          {status === "not-found" && (
            <div role="status" className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-800">
                Order not found
              </p>
              <p className="mt-1 text-sm text-slate-600">
                This order ID does not match an order in the current dataset.
              </p>
            </div>
          )}
          {status === "loaded" && order && (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${orderStatusStyles[order.status]}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Order total</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {currency.format(order.amount)}
                  </p>
                </div>
              </div>

              <section aria-labelledby="customer-heading" className="mt-8">
                <h3
                  id="customer-heading"
                  className="text-sm font-semibold text-slate-900"
                >
                  Customer
                </h3>
                <dl className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 px-4">
                  <div className="flex flex-wrap justify-between gap-2 py-3">
                    <dt className="text-sm text-slate-500">Name</dt>
                    <dd className="text-sm font-medium text-slate-800">
                      {order.customer}
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 py-3">
                    <dt className="text-sm text-slate-500">Email</dt>
                    <dd className="break-all text-sm font-medium text-slate-800">
                      <a
                        href={`mailto:${order.email}`}
                        className="rounded text-indigo-700 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        {order.email}
                      </a>
                    </dd>
                  </div>
                </dl>
              </section>

              <section aria-labelledby="order-info-heading" className="mt-8">
                <h3
                  id="order-info-heading"
                  className="text-sm font-semibold text-slate-900"
                >
                  Order information
                </h3>
                <dl className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 px-4">
                  <div className="flex justify-between gap-2 py-3">
                    <dt className="text-sm text-slate-500">Order ID</dt>
                    <dd className="text-sm font-medium text-slate-800">
                      {order.id}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 py-3">
                    <dt className="text-sm text-slate-500">Order date</dt>
                    <dd className="text-sm font-medium text-slate-800">
                      {date}
                    </dd>
                  </div>
                </dl>
              </section>
            </>
          )}
        </div>
        <footer className="border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Back to orders
          </button>
        </footer>
      </section>
    </div>
  );
}
