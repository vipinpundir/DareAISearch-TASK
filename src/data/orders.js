const ORDER_COUNT = 20_000;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const FIRST_ORDER_DATE = Date.UTC(2024, 0, 1);
const ORDER_DATE_RANGE_DAYS = 900;

const firstNames = [
  "Aarav", "Aanya", "Aditya", "Aisha", "Akash", "Ananya", "Arjun", "Diya",
  "Ishaan", "Kabir", "Kavya", "Meera", "Neha", "Priya", "Rahul", "Riya",
  "Rohan", "Sana", "Vihaan", "Zara",
];

const lastNames = [
  "Agarwal", "Bansal", "Chandra", "Desai", "Gupta", "Iyer", "Jain", "Kapoor",
  "Khan", "Malhotra", "Mehta", "Nair", "Patel", "Reddy", "Shah", "Sharma",
  "Singh", "Verma", "Wadhwa", "Yadav",
];

const statuses = ["Delivered", "Processing", "Cancelled"];

function stableValue(index, salt) {
  let value = Math.imul(index + 1, 0x45d9f3b) ^ salt;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return (value ^ (value >>> 16)) >>> 0;
}

function createOrder(index) {
  const firstName = firstNames[stableValue(index, 101) % firstNames.length];
  const lastName = lastNames[stableValue(index, 211) % lastNames.length];
  const customer = `${firstName} ${lastName}`;
  const date = new Date(
    FIRST_ORDER_DATE +
      (stableValue(index, 307) % ORDER_DATE_RANGE_DAYS) * DAY_IN_MS,
  ).toISOString();
  const status = statuses[stableValue(index, 401) % statuses.length];

  return {
    id: `ORD-${String(100001 + index)}`,
    customer,
    email: `${firstName}.${lastName}.${index + 1}@example.com`.toLowerCase(),
    date,
    amount: 500 + (stableValue(index, 503) % 5_000_000) / 100,
    status,
  };
}

export const orders = Array.from(
  { length: ORDER_COUNT },
  (_, index) => createOrder(index),
);

export const ordersSummary = orders.reduce(
  (summary, order) => {
    summary.revenue += order.amount;
    if (order.status === "Processing") summary.processingOrders += 1;
    return summary;
  },
  {
    totalOrders: orders.length,
    processingOrders: 0,
    revenue: 0,
  },
);
