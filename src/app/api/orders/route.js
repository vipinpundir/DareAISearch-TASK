import { ordersSummary } from "@/data/orders";
import { queryOrders } from "@/lib/orders-query";

export const dynamic = "force-dynamic";

const MIN_LATENCY_MS = 200;
const MAX_LATENCY_MS = 3_000;
const MAX_PAGE_SIZE = 100;
const sortFields = new Set([
  "id",
  "customer",
  "date",
  "amount",
  "status",
]);
const validStatuses = new Set([
  "Delivered",
  "Processing",
  "Cancelled",
]);

function badRequest(message) {
  return Response.json(
    { error: { code: "INVALID_QUERY", message } },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}

function integerParameter(
  params,
  key,
  fallback,
  minimum,
  maximum = Number.MAX_SAFE_INTEGER,
) {
  const raw = params.get(key);
  if (raw === null) return fallback;
  if (!/^\d+$/.test(raw)) return null;

  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= minimum && value <= maximum
    ? value
    : null;
}

function parseQuery(url) {
  const params = url.searchParams;
  const search = (params.get("search") ?? params.get("q") ?? "").trim();
  if (search.length > 100) {
    return { error: "Search text must be 100 characters or fewer." };
  }

  const requestedStatus = params.get("status");
  const status =
    requestedStatus && requestedStatus.toLowerCase() !== "all"
      ? [...validStatuses].find(
          (value) => value.toLowerCase() === requestedStatus.toLowerCase(),
        ) ?? null
      : undefined;
  if (status === null) {
    return { error: "Status must be Delivered, Processing, Cancelled, or all." };
  }

  const sortByValue = params.get("sortBy") ?? "date";
  if (!sortFields.has(sortByValue)) {
    return { error: "sortBy must be id, customer, date, amount, or status." };
  }

  const sortOrder = params.get("sortOrder") ?? "desc";
  if (sortOrder !== "asc" && sortOrder !== "desc") {
    return { error: "sortOrder must be asc or desc." };
  }

  const page = integerParameter(params, "page", 1, 1);
  const pageSize = integerParameter(params, "pageSize", 10, 1, MAX_PAGE_SIZE);
  if (page === null || pageSize === null) {
    return {
      error: `page must be a positive integer and pageSize must be between 1 and ${MAX_PAGE_SIZE}.`,
    };
  }

  return {
    value: {
      search,
      status,
      sortBy: sortByValue,
      sortOrder,
      page,
      pageSize,
    },
  };
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function GET(request) {
  const parsed = parseQuery(new URL(request.url));
  if ("error" in parsed && parsed.error) return badRequest(parsed.error);

  const latency = Math.floor(
    Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS + 1),
  ) + MIN_LATENCY_MS;
  await wait(latency);

  if (Math.random() < 0.1) {
    return Response.json(
      {
        error: {
          code: "MOCK_SERVICE_UNAVAILABLE",
          message: "The mock orders service is temporarily unavailable. Please retry.",
        },
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": "1",
        },
      },
    );
  }

  const result = queryOrders(parsed.value);

  return Response.json(
    {
      data: result.data,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
      summary: ordersSummary,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
