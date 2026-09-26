# Engineers Veedu — Frontend (React 18 + Vite + TailwindCSS)

Modern, highly responsive single-page web application (SPA) for the **Engineers Veedu** Construction Management Platform. Engineered with role-specific dashboards, interactive daily site logs, AI construction analytics, interactive project tracker, and real-time community hub.

---

## 1. Technologies & Architecture

- **Core Library**: React 18
- **Build Tool**: Vite (Ultra-fast HMR and optimized production bundles)
- **Styling**: Tailwind CSS & Vanilla CSS transitions
- **Routing**: `react-router-dom` v6 with role-based route guards
- **State & HTTP**: Centralized `apiClient.js` with Axios interceptors for automatic JWT injection and expired token redirection
- **Icons**: Lucide React
- **Code Standards**: ESLint 9+ (Flat Config, 0 errors, 0 warnings)
- **Security**: 0 npm vulnerabilities (`npm audit`)

---

## 2. Project Directory Structure

```
frontend/
├── public/                     # Static brand assets and favicons
├── src/
│   ├── assets/                 # Local image assets
│   ├── components/             # Modular reusable components
│   │   ├── Header.jsx          # Dynamic navigation bar with role badges & logout
│   │   ├── Footer.jsx          # Global platform footer
│   │   ├── Chatbot.jsx         # RAG construction assistant floating widget
│   │   ├── ProjectTracker.jsx  # Interactive WBS milestones, progress bars, photo viewer
│   │   └── community/          # Community forum, trending topics, member directory
│   ├── pages/                  # Top-level view controllers & dashboards
│   │   ├── Home.jsx            # Landing page showcasing services & stats
│   │   ├── Login.jsx           # Clean authentication modal (Login / Register)
│   │   ├── ClientDashboard.jsx # Project overview, cost charts, approval actions
│   │   ├── ContractorDashboard.jsx # Multi-project oversight, engineer assignment, AI health
│   │   ├── SiteEngineerDashboard.jsx # Daily process logs, safety checklists, photo uploads
│   │   ├── ProjectTrackerPage.jsx # Full-page construction tracker
│   │   ├── Community.jsx       # Collaborative network for civil engineers & builders
│   │   └── Support.jsx         # Customer support, helpdesk, FAQ
│   ├── services/               # API abstraction layer
│   │   ├── apiClient.js        # Centralized Axios client with JWT interceptor
│   │   ├── authService.js      # User registration, login, logout, profile
│   │   ├── projectService.js   # CRUD operations for construction projects
│   │   ├── dailyLogService.js  # Daily site logs & photo upload service
│   │   └── communityService.js # Community feed and interaction service
│   ├── App.jsx                 # Master application routing & role guards
│   ├── index.css               # Design system tokens & Tailwind imports
│   └── main.jsx                # React DOM entrypoint
├── .gitignore                  # Ignores node_modules, dist, .vite, environment files
├── eslint.config.js            # Strict code quality rules
├── index.html                  # HTML5 entrypoint with SEO meta tags
├── package.json                # Project scripts & dependencies
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Custom theme extensions & colors
├── vite.config.js              # Vite server & proxy configuration
└── README.md                   # Frontend documentation
```

---

## 3. Installation & Local Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```
The application will launch at: `http://localhost:5173/`

### Step 3: Run Code Quality Linter
```bash
npm run lint
```
(Passes with 0 errors and 0 warnings).

### Step 4: Build for Production
```bash
npm run build
```
Production assets are generated in `frontend/dist/`.

---

## 4. Role-Based Navigation & Workflow

The platform delivers personalized dashboards based on the logged-in user's role:

| Role | Primary Dashboard Route | Capabilities |
|---|---|---|
| **Client** | `/client-dashboard` | Track assigned home project progress, inspect daily milestone photos, request quotations, view budget breakdowns. |
| **Contractor** | `/contractor-dashboard` | Oversee all contracted projects, assign site engineers, run Gemini AI schedule delay analysis, review client requests. |
| **Site Engineer** | `/site-engineer-dashboard` | Submit daily progress logs, check off work breakdown tasks, upload site inspection photos, report material delays. |

---

## 5. Authentication Flow

1. **Sign Up / Login**: User registers or logs in through `/login`. Role is selected upon registration (`client`, `contractor`, `site_engineer`).
2. **Token Storage**: On successful authentication, DRF returns `{ access, refresh, user }`. The access token and user metadata are stored securely in `localStorage`.
3. **Automatic Header Injection**: Every outgoing HTTP request sent via `apiClient.js` automatically attaches:
   ```http
   Authorization: Bearer <access_token>
   ```
4. **Session Expiry**: If a `401 Unauthorized` is returned by the backend, `apiClient.js` clears stored credentials and redirects to `/login`.
