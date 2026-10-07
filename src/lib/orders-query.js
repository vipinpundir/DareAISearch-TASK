import { orders } from "@/data/orders";

export function queryOrders(query) {
  const normalizedSearch = query.search.trim().toLowerCase();
  const direction = query.sortOrder === "asc" ? 1 : -1;

  const filtered = orders.filter((order) => {
    if (query.status && order.status !== query.status) return false;
    if (!normalizedSearch) return true;

    return (
      order.id.toLowerCase().includes(normalizedSearch) ||
      order.customer.toLowerCase().includes(normalizedSearch) ||
      order.email.toLowerCase().includes(normalizedSearch)
    );
  });

  filtered.sort((left, right) => {
    const primary = compareOrders(left, right, query.sortBy);
    return primary === 0 ? left.id.localeCompare(right.id) : primary * direction;
  });

  const total = filtered.length;
  const start = (query.page - 1) * query.pageSize;

  return {
    data: filtered.slice(start, start + query.pageSize),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

function compareOrders(left, right, field) {
  if (field === "amount") return left.amount - right.amount;
  return left[field].localeCompare(right[field], "en", { numeric: true });
}
