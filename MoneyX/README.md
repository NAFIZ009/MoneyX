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

1. Copy `.env.example` to `.env` and add your Firebase config
2. Install dependencies:

```bash
npm install
```

3. Deploy Firestore indexes (see `firestore.indexes.json`)
4. Start dev server:

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Core Formula

```
Expendables = Salary − (Fixed Expenses + DPS + Outstanding Credit Card Bills)
```

Credit card purchases reserve from expendables and add to the card bill. Paying a bill reduces the outstanding balance used in calculations.
