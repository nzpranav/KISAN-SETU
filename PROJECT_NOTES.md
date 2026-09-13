# Kisan Setu — latest refinement

The existing farmer-first layout has been preserved. This refinement focuses on readability, accessibility, animations, multilingual structure, payment UX, private document access, GPS-linked weather, market presentation, crop history, and transparent financial analysis.

## Local development
```bash
npm install
npm run install-all
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000
Health: http://localhost:5000/api/health

## Notes
Live weather is fetched from Open-Meteo using current GPS coordinates when available. Market data remains provider/API-ready and is clearly labeled. UPI payment creation remains pending until a legitimate provider/bank confirmation is integrated.
