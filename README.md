# Kisan Setu — Full Stack (PRO Refined)

This version keeps the existing Kisan Setu workflow and adds a professional usability pass without replacing the dashboard architecture.

## Run

```bash
npm install
npm run install-all
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

## Market data

The backend supports an approved market provider through `MARKET_API_URL`. Do not scrape or bypass provider restrictions.

For local demonstrations only, set `MARKET_DEMO=true`. Demo rows are explicitly labeled as non-live data in the UI.

## Weather

Weather uses browser GPS coordinates and Open-Meteo when the browser location is available. A location permission denial does not block the rest of the app.

## UPI

The UPI QR is generated for `nyxaro@ptyes`. Displaying a QR or clicking "Create Payment" never marks a payment successful. Provider/bank confirmation is required.

## Latest refinement

- Improved readable typography and touch targets
- Reduced-motion support
- More robust English/Hindi/Marathi text replacement for common UI labels
- Dashboard summary expansion
- Activity-based notifications panel
- Crop edit/status/quantity/history improvements
- Market A/B net-return comparison
- No invented historical price chart when historical data is unavailable
- Payment provider verification action and receipt-copy action
- Optional approved market provider environment variable
