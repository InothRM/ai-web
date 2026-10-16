# Split the Check

A React + Vite frontend and local Express API for splitting a restaurant receipt with friends. The demo accepts PDF and image receipts, shows mock extracted food items, tax, tip, and total, then calculates an equal share for each person in the browser. AI-powered receipt extraction is not implemented yet, and uploads are held in memory rather than saved.

## Run locally

From the project root:

```sh
npm install
npm run dev
```

The frontend runs at `http://127.0.0.1:5173` and the API runs at `http://127.0.0.1:3001`. Vite proxies `/api` requests to Express during development.

Build the frontend with `npm run build`. Start the API alone with `npm start`.

## API

- `GET /api/health` returns the API health status.
- `POST /api/receipt` accepts one PDF, JPG, PNG, or WEBP file in the multipart `receipt` field (maximum 10MB). It returns mock items, tax, and tip; the frontend calculates the total and equal friend shares.
