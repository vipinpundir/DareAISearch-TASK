import { Suspense } from "react";
import { OrdersPage } from "@/components/orders/orders-page";

export default function OrdersRoute() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen p-8">
          <p role="status" className="text-sm text-slate-500">
            Loading Orders Explorer…
          </p>
        </main>
      }
    >
      <OrdersPage />
    </Suspense>
  );
}
