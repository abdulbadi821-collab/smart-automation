# AI Learning Assistant

A full-stack, real-time AI Learning Assistant built with React, Vite, Tailwind CSS, Express, Supabase, and Google Gemini API.

---

## 🌟 Tech Stack & Architecture

- **Frontend**: React (Functional Components + Hooks), Vite, Tailwind CSS (Custom Emerald/Mint palette), React Router v6, `@supabase/supabase-js`, Lucide Icons.
- **Backend API**: Node.js, Express, `@supabase/supabase-js`, `@google/genai` (Official modern SDK), CORS, Dotenv.
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) policies, database triggers, email/password authentication, and Supabase Realtime for live chat status transitions.
- **AI Engine**: Google Gemini API using `gemini-3.1-flash-lite` (with automatic fallback to `gemini-2.5-flash`).

---

## 📁 Repository Structure

```
.
├── .gitignore
├── README.md
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── supabase.js
│       ├── api/
│       │   └── client.js
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── PublicOnlyRoute.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       └── pages/
│           ├── ChatPage.jsx
│           ├── DashboardPage.jsx
│           ├── HistoryPage.jsx
│           ├── LandingPage.jsx
│           ├── LoginPage.jsx
│           └── RegisterPage.jsx
└── supabase/
    └── migrations/
        └── 0001_init.sql
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and supply your keys:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-google-gemini-api-key
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:5000
```

> **Security Note:** Real keys, passwords, and `.env` files are ignored by git in `.gitignore`. `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are backend-only and never exposed to the client.

---

## 🗄️ Database Setup (Supabase)

1. Open your Supabase project dashboard.
2. Navigate to the **SQL Editor**.
3. Run the migration script located in [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql).
   - Creates `profiles`, `conversations`, and `messages` tables.
   - Sets up automatic user profile generation triggers on signup.
   - Configures Row Level Security (RLS) guaranteeing user data isolation (`auth.uid() = user_id`).
   - Adds `messages` table to `supabase_realtime` publication for live status notifications.

---

## 🚀 Running Locally

### 1. Start the Backend API
```bash
cd backend
npm install
npm run dev
# Server will run at http://localhost:5000
```

### 2. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
# Frontend will be accessible at http://localhost:5173
```

---

## 🧭 Flow & Features

1. **Landing Page (`/`)**: Explains core benefits, features interactive previews, and provides direct CTAs.
2. **Authentication (`/login`, `/register`)**: Email + password login with show/hide password toggle, input validation, and redirect guards.
3. **Dashboard (`/dashboard`)**:
   - Live metrics for total conversations and messages exchanged.
   - Designed empty state for new accounts.
   - Quick learning starter cards to prompt discussions.
   - "Start New Chat" action creating a conversation and routing to chat.
4. **Chat (`/chat/:id`)**:
   - Message history restored on mount and page refresh.
   - Multi-step Realtime status pipeline:
     - `sending`: Queued in system
     - `generating`: Gemini AI streaming/generating
     - `completed`: Full response rendered
   - Live subscription using Supabase Realtime without manual polling.
5. **History (`/history`)**:
   - Paginated/chronological list of all conversations.
   - One-click deletion with confirmation dialog and automatic cascading message purge.
   - Realtime state pruning upon removal.
