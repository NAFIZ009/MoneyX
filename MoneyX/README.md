# MoneyX

Personal expense tracker built for monthly salary budgeting in Bangladesh (BDT).

## Features

- **Expendables tracking** — Salary minus fixed expenses, DPS, and credit card bills
- **Daily expenses** — Cash and credit card spending with categories
- **Management** — Salary, fixed expenses, DPS, FD, credit cards, savings goals
- **Debts** — Personal loans, EMIs, and money lent
- **Onboarding** — Guided first-time setup with salary and recurring items

## Tech Stack

- React 19 + Vite
- Firebase Auth & Firestore
- Tailwind CSS

## Setup

1. Copy `MoneyX/.env.example` to `.env` at the **repo root** (one level above `MoneyX/`) or inside the `MoneyX/` app folder, and add your Firebase config.
2. Install dependencies from the `MoneyX/` app folder:

```bash
cd MoneyX
npm install
```

3. Run smoke test (optional):

```bash
npm run test:smoke
```

4. Deploy Firestore indexes (see `firestore.indexes.json`)
5. Start dev server:

```bash
npm run dev
```

App runs at http://localhost:3000

### Vercel deployment

Add all `VITE_*` variables from `.env.example` in **Vercel → Project Settings → Environment Variables**. Vercel does not use your local `.env` file.

## Build

```bash
npm run build
```

## Core Formula

```
Expendables = Salary − (Fixed Expenses + DPS + Outstanding Credit Card Bills)
```

Credit card purchases reserve from expendables and add to the card bill. Paying a bill reduces the outstanding balance used in calculations.
