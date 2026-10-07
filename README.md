# DareAI Orders Explorer

A responsive order-management interface built for the DareAISearch Front-End Developer assignment. Browse, search, filter, sort, and page through a generated dataset of 20,000 orders, then open an order in a shareable detail drawer.

## Live demo

[Open the Orders Explorer live demo](https://6ac689f992e28f3093b7c32a--stellular-faun-06c0d0.netlify.app/orders?sortOrder=asc).

## Features

- Search by order ID, customer name, or email; filter by status; sort by order ID, customer, date, amount, or status.
- Server-side pagination with selectable page sizes.
- URL-backed list state and shareable order detail links.
- Virtualized table rows, responsive layout, and INR currency formatting.
- Loading, empty, API error, and retry states for both the order list and detail drawer.
- Accessible controls, status announcements, keyboard navigation, and focus management.

## Tech stack

- Next.js 16 App Router and React 19
- JavaScript (JSX)
- Tailwind CSS 4
- Native browser APIs for fetch cancellation, URL/history state, and formatting

No database, component library, or additional runtime dependencies are used.

## Architecture

```text
src/
  app/                     App Router pages, layout, styles, and API route
    api/orders/route.js    Mock Orders API
    orders/page.jsx        Orders Explorer route
  components/orders/       Explorer, table, summary, and detail drawer
  data/orders.js           Generated orders and dataset summary
  lib/orders-query.js      Search, filter, sort, and pagination logic
```

The API route validates query parameters and runs the query against the generated in-memory dataset. The client reads explorer state from the URL, requests the selected page, and renders the results. Order details reuse the Orders API and are displayed in a drawer controlled by the `order` query parameter.

## Server-side API and mock data

`GET /api/orders` accepts `search` (or `q`), `status`, `sortBy`, `sortOrder`, `page`, and `pageSize`. Search, status filtering, sorting, and pagination are applied in the API route. A successful response includes `data`, `pagination`, and a dataset-wide `summary`. Invalid query parameters return HTTP 400.

The dataset contains 20,000 generated orders with stable IDs and deterministic customer, date, status, and amount values. It is generated in memory; there is no persistent database.

For valid requests, the mock API waits a random **200 ms–3 seconds**, then has a **10% probability** of returning HTTP 503. These intentional delays and failures exercise the UI's asynchronous states; they are not representative of production service guarantees.

## Request handling and performance

- Search input is debounced by 350 ms. Starting a newer query aborts the active fetch; request sequence checks also ignore superseded responses.
- Search, status, sort direction/field, page, page size, and the selected order are reflected in URL query parameters. Refresh, shared URLs, and browser back/forward restore the corresponding state.
- The table uses custom fixed-height row virtualization (72 px rows, a 520 px scroll viewport, and five rows of overscan on either side). Only the visible slice of the current page is mounted.
- This is a client-rendered table over API-paginated results; virtualization limits DOM work, while the API still filters and sorts matching records in memory for each request.

## Loading, errors, and recovery

The list and detail drawer each expose loading feedback, an error message, and a Retry action. An empty result has a separate message from an unavailable result. A detail URL whose ID does not match an order shows a not-found state.

## Accessibility

The interface uses labeled controls, semantic table headers and row headers, a skip link, visible keyboard focus, and live status/result announcements. The detail drawer has dialog semantics, traps keyboard focus, supports Escape to close, and focuses its heading when opened. The background is made inert while the drawer is open. Closing an in-app drawer restores focus to the order link and the saved result-list scroll position; direct detail links can also be opened and closed while retaining the list query state.

## Testing and validation

During development, GitHub Copilot used Playwright browser checks to exercise key flows, including opening and closing the order detail drawer, keyboard focus behavior, and restoring the URL and focus. These were development-time browser checks; the repository does **not** include an automated Playwright test suite or other automated test files.

The available project checks are:

```bash
npm run lint
npm run build
```

## Local setup

Install a compatible Node.js runtime and npm, then run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To run a production build locally:

```bash
npm run build
npm start
```

## Deployment

The project has no provider-specific deployment configuration. It can be deployed to a Next.js-compatible host that supports App Router route handlers; use that host's documented build/start process. The mock dataset is generated in memory by the app, so it is not shared persistent storage across separate server instances. No public deployment URL is currently available.

## Tradeoffs

- The deterministic in-memory dataset keeps the assignment self-contained, but does not model database indexing, persistence, or multi-instance consistency.
- Every API query filters and sorts in memory. This is suitable for the fixed 20,000-record mock dataset, but a production service should push these operations to an indexed data store.
- Random latency and failures intentionally make the interface less predictable so loading and retry behavior can be exercised.
- Virtualization is deliberately scoped to the current paginated result set, not an unlimited scrolling feed.

## Sources and references

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [React documentation](https://react.dev/learn)
- [Tailwind CSS documentation](https://tailwindcss.com/docs)
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

## AI usage

GPT was used to help refine prompts, and GitHub Copilot was used to assist with the code. The developer reviewed, tested, and adapted the generated output.
