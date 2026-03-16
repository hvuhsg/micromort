# Micromort Calculator

A web survey that calculates your estimated **daily micromorts** — your one-in-a-million chance of death each day — based on your body, habits, and location.

After submitting, you see where you fall compared to everyone else, your age group, and your country.

## What's a Micromort?

A **micromort** is a unit of risk equal to a one-in-a-million probability of death. The concept was introduced by Ronald Howard at Stanford to help people reason about everyday risks.

For example:
- Living 1 day as a healthy 30-year-old ≈ **1.4 micromorts**
- Driving 400 km by car ≈ **1.2 micromorts**
- One skydive ≈ **8 micromorts**
- Smoking 1 cigarette ≈ **0.5 micromorts**

## How It Works

1. **Survey** — 4-step form covering body (age, sex, BMI, medical conditions), habits (transport, diet, smoking, alcohol, exercise), risky activities, and location
2. **Calculation** — Computes daily micromorts using published data from Spiegelhalter (Cambridge), WHO, CDC, and actuarial life tables
3. **Comparison** — Shows your percentile vs all users, your age group, and your country, with a distribution chart

## Tech Stack

- **SvelteKit 2** with **Svelte 5** (runes)
- **Cloudflare Pages** (hosting)
- **Cloudflare D1** (SQLite database)
- **Tailwind CSS v4**

## Getting Started

```bash
# Install dependencies
npm install

# Apply database migrations locally
npm run db:migrate

# Build and start dev server
npm run dev
```

The app runs at `http://localhost:8788`.

## Deployment

```bash
# Login to Cloudflare
npx wrangler login

# Apply migrations to production D1
npm run db:migrate:remote

# Deploy
npx wrangler pages deploy .svelte-kit/cloudflare
```

## Data Sources

- Ronald Howard's micromort concept (Stanford)
- David Spiegelhalter's "Understanding Uncertainty" (Cambridge)
- WHO Global Health Observatory
- CDC National Vital Statistics / WISQARS
- SSA Period Life Tables
- Global Burden of Disease study

This is an educational tool, not medical advice.
