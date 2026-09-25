# Expense Manager (Personal & Office)

A modern, super mobile-friendly full-stack Expense & Income Manager built with **Express**, **MongoDB Atlas (Mongoose)**, **Vite + React (TypeScript)**, **Tailwind CSS**, and **Lucide Icons**.

Designed specifically for fast one-handed mobile daily logging while offering a rich, responsive interface on tablets and desktop browsers.

---

## ✨ Highlights & Features

### 1. 🗂️ 100% Dynamic Base Types (Scopes)
- Manage both **Personal** and **Office** expenses in one unified system.
- Completely dynamic: create any number of custom scopes (e.g. *Freelance*, *Side Business*, *Family*).
- **Fully editable**: Any name can be edited anytime, icons and colors changed, and descriptions updated.
- **Sticky 1-tap Scope Switcher**: Seamlessly switch between `All Scopes`, `Personal`, `Office`, or custom scopes with immediate recalculation of all balances and analytics.

### 2. 💳 Dynamic Payment Sources & Accounts
- Track multiple payment accounts: **Cash**, **Bank Accounts**, **Mobile Banking (bKash, Nagad, etc.)**, **Savings**, and **Cards**.
- Real-time balance computation based on income, expenses, and inter-account transfers.
- **Fully editable**: Edit names, account types, custom icons, and theme colors.

### 3. 🏷️ Dynamic Categories with Icons & Colors
- Separate **Expense** and **Income** categories.
- Assign categories globally or restrict them to specific scopes (e.g., *Office Supplies* for Office only).
- Visual **Icon Picker** (100+ curated Lucide icons in Finance, Office, Food, Transport, Tech, Living, Health).
- Visual **Color Picker** (18 vibrant presets + custom hex codes).
- Optional monthly budget limit tracking per category.

### 4. 📱 Super Mobile-Friendly UX
- **Bottom Navigation Bar**: Thumb-accessible navigation (`Overview`, `History`, `Analytics`, `Manage`).
- **Quick-Add Floating Action Button (FAB)**: Log transactions in seconds.
- **Bottom Sheet Drawer Form**:
  - Segmented toggle for *Expense*, *Income*, and *Transfer*.
  - Large amount input with quick increment buttons (+50, +100, +500, +1000).
  - Scope and account selectors with visual badges.
  - Visual category grid with custom colors & icons.
  - Quick date selection and notes.
- **Filters Sheet**: Filter by date range (Today, This Week, This Month), transaction type, scope, source, and category.

### 5. 📊 Analytics & Visual Reporting
- **Category Donut Breakdown**: Spending distribution chart powered by Recharts.
- **6-Month Trend Bar Chart**: Compare monthly income vs expenses.
- **Category Spending Ranks**: Ranked lists with percentage progress bars.
- **CSV Export**: Download expense reports for spreadsheets or tax records.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v22)
- **npm** v9+

### 2. Environment Setup
Create a `.env` file in the root directory (refer to `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Running in Development
Run both the Express backend and the Vite client simultaneously:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

### 4. Production Build & Run
```bash
# Build the Vite frontend
npm run build

# Start the Express production server
npm start
```

---

## 🛠️ API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/base-types` | Get all base types / scopes |
| `POST` | `/api/base-types` | Create a new base type |
| `PUT` | `/api/base-types/:id` | Update any base type (name, icon, color, etc.) |
| `DELETE` | `/api/base-types/:id` | Delete a base type (`?force=true` if linked) |
| `GET` | `/api/sources` | Get all payment sources with computed balances |
| `POST` | `/api/sources` | Create a new payment source |
| `PUT` | `/api/sources/:id` | Update source details (name, icon, color, etc.) |
| `DELETE` | `/api/sources/:id` | Delete a source |
| `GET` | `/api/categories` | Get categories (filterable by `type` and `baseTypeId`) |
| `POST` | `/api/categories` | Create a new category |
| `PUT` | `/api/categories/:id` | Update category details |
| `DELETE` | `/api/categories/:id` | Delete a category |
| `GET` | `/api/transactions` | Search & filter transactions with pagination |
| `POST` | `/api/transactions` | Log an expense, income, or transfer |
| `PUT` | `/api/transactions/:id` | Edit any transaction |
| `DELETE` | `/api/transactions/:id` | Delete a transaction |
| `GET` | `/api/stats/summary` | Analytics, donut breakdown & 6-month trends |

---

## 📱 Mobile Best Practices Applied
- Responsive viewport meta tag preventing unwanted double-tap scaling on mobile.
- `safe-area-inset` support for modern smartphones with notches or home indicators.
- Bottom sheet modals designed for thumb ergonomics.
- High-contrast, sleek modern dark theme with clean slate typography.
