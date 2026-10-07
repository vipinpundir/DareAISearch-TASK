"use client";

import { useCallback, useState } from "react";
import { OrdersSummary } from "./orders-summary";
import { OrdersTable } from "./orders-table";

export function OrdersPage() {
  const [summary, setSummary] = useState(null);
  const updateSummary = useCallback((value) => {
    setSummary(value);
  }, []);

  return (
    <main className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white px-5 py-7 lg:flex">
        <a href="/orders" className="flex items-center gap-3 px-2">
          <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
            D
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            dareai
          </span>
        </a>
        <p className="mb-3 mt-11 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>
        <a
          href="/orders"
          aria-current="page"
          className="flex items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700"
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
        <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">Need a hand?</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Your workspace is ready to explore.
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <p className="text-sm text-slate-500">Workspace / Orders</p>
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
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Orders
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Track and manage your recent customer orders.
              </p>
            </div>

            <OrdersSummary summary={summary} />
            <OrdersTable onSummaryChange={updateSummary} />
          </div>
        </div>
      </div>
    </main>
  );
}
