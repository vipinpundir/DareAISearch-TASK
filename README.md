# DareAI Orders Explorer

A small Next.js application using the App Router, JavaScript, and Tailwind CSS.

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to
`/orders`.

## Project structure

- `src/app/` contains the root layout, global styles, and route entry points.
- `src/app/orders/` defines the Orders Explorer route.
- `src/app/api/orders/` provides the mock Orders API.
- `src/components/orders/` contains the Orders page, summary, and table UI.
- `src/data/` generates the stable 20,000-record mock dataset.
- `src/lib/orders-query.js` applies server-side search, filtering, sorting, and pagination.
- `public/` contains static assets.

## Mock Orders API

`GET /api/orders` supports these query parameters:

- `search` (or `q`): match an order ID, customer name, or email.
- `status`: `Delivered`, `Processing`, `Cancelled`, or `all`.
- `sortBy`: `id`, `customer`, `date`, `amount`, or `status`.
- `sortOrder`: `asc` or `desc`.
- `page` and `pageSize`: one-based page number and page size (1–100).

Responses contain `data`, `pagination`, and dataset-wide `summary` objects.
Valid requests have 200–3,000 ms of simulated latency and a 10% chance of
returning HTTP 503 to exercise retry handling. Invalid query parameters return
HTTP 400 without simulation delay.
