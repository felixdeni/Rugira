# RUGIRA Install & Login

Build a real, production-ready PWA called RUGIRA, developed by Chanel.

Do NOT use TanStack. Do NOT use fake/demo data. Use React + Vite + TypeScript + Tailwind CSS + Supabase.

Important User Flow

When a user opens RUGIRA:

Show the RUGIRA logo (R) and app name.

Show a clear message asking the user to install RUGIRA first.

Show a large “Install RUGIRA” button.

The user must install the PWA before accessing the Login page.

After successful installation, allow the user to continue to Login.

Homepage must contain only this installation requirement and then Login — no marketing/landing page.

If PWA installation is not supported, show clear browser-specific installation instructions instead of pretending it was installed.

Design

Use ONLY these main colors:

🟢 Green

🔵 Sky Blue

🟡 Yellow

Use a clean modern glassmorphism UI, responsive/mobile-first design, rounded cards, professional icons, and dark/light mode.

Use Lucide icons, not emojis, throughout the application.

Logo:

R

App name:

RUGIRA

Developer:

Developed by Chanel

Users

Create only 2 roles:

Employee

Records today's sales

Can see Daily and Weekly reports

Can see their 40% earnings

Boss

Does NOT record sales

Can see sales and Daily/Weekly/Monthly/Yearly reports

Can see Employee 40% and Boss 60%

Use Supabase Authentication and RLS.

Create default user profiles for:

Employee — role employee

Boss — role boss

Do not expose passwords in frontend code.

Sales

Only 3 categories:

New SIM Card

SIM Swap

Movies & Songs

Employee can record today's transactions only.

Calculations

Employee = 40%

Boss = 60%

New SIM:

Gross = Quantity × Price

Net = Gross − Airtime

Employee = Net × 40%

Boss = Net × 60%

SIM Swap and Movies & Songs:

Gross = Quantity × Price

Employee = Gross × 40%

Boss = Gross × 60%

For Movies & Songs use the field name Price, not “Price per item”.

Database

Use one real Supabase transactions table.

Every transaction must automatically update:

Dashboard

Sales

Reports

Employee earnings

Boss earnings

Category totals

All pages must use the same real transaction data so calculations never differ.

Final requirement

Keep RUGIRA simple.

No chat, inventory, customers, payments, software services, notifications, CRM, or other unnecessary features.

The core flow is:

Install RUGIRA → Login → Employee records today's sales → Boss views reports.

Make it a real, secure, installable PWA with accurate calculations and zero fake data.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9de62ef4-589c-49d5-9ac3-66c5f18e17f5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
