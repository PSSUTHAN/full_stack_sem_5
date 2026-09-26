# Engineers Veedu — Full Stack Construction Management Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-4.2%2B-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

An end-to-end, enterprise-grade Construction Management and Client Experience System. Combines a **Django REST Framework (DRF) + MySQL** backend with a high-performance **React 18 + Vite** frontend. Features role-based dashboards (Client, Contractor, Site Engineer), daily site logs with inspection photo uploads, Google Gemini AI schedule health analytics, and an intelligent construction knowledge chatbot.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │             React 18 Single-Page App         │
                      │           (Vite + Tailwind CSS + Lucide)     │
                      │  Ports: 5173 / Client, Contractor, Engineer  │
                      └──────────────────────┬───────────────────────┘
                                             │ HTTP / JWT Bearer
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │         Django REST Framework Backend        │
                      │       (Authentication, RBAC, API Router)     │
                      │                  Port: 5000                  │
                      └───────────┬───────────────────┬──────────────┘
                                  │                   │
                     SQL Queries  │                   │ Prompt & Retrieval
                                  ▼                   ▼
                      ┌──────────────────────┐  ┌─────────────────────┐
                      │   MySQL Database     │  │  Google Gemini API  │
                      │  (constructor_db)    │  │  & RAG Knowledge    │
                      └──────────────────────┘  └─────────────────────┘
```

---

## Repository Structure

```
full_stack_sem_5/
├── backend/                     # Django REST Framework Backend
│   ├── apps/                    # Modular apps: accounts, projects, daily_logs, client_requests, ai_analysis, chatbot
│   ├── config/                  # Settings, master URLs, upload handlers
│   ├── uploads/                 # Site inspection photos (.gitkeep preserved)
│   ├── manage.py                # Django CLI
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment template
│   └── README.md                # Detailed backend documentation
│
├── frontend/                    # React 18 + Vite Frontend
│   ├── src/                     # Components, pages, services, styles
│   ├── public/                  # Static brand assets
│   ├── package.json             # Scripts & dependencies
│   ├── vite.config.js           # Vite configuration
│   └── README.md                # Detailed frontend documentation
│
├── .gitignore                   # Workspace gitignore (ignores .env, node_modules, *.db, uploads)
├── PROJECT_INDUSTRY_STANDARD_REPORT.md # In-depth architectural audit and industry report
└── README.md                    # Root project documentation (this file)
```

---

## Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **MySQL Server** (running locally on port 3306 or remote)

---

### 1. Database Setup
Start your MySQL server and create the database:
```sql
CREATE DATABASE IF NOT EXISTS constructor_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create & activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials and Gemini API Key

# Apply database migrations
python manage.py migrate

# Start backend server
python manage.py runserver 127.0.0.1:5000
```
Backend API will be running at `http://127.0.0.1:5000/api/`

---

### 3. Frontend Setup
In a new terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend will be running at `http://localhost:5173/`

---

## Key Features

1. **Role-Based Access Control (RBAC)**:
   - **Contractor**: Creates & manages multiple construction projects, assigns site engineers, reviews client quotation requests, and runs AI schedule analysis.
   - **Site Engineer**: Submits daily operational logs, inspection checklists, logs equipment breakdowns, and uploads high-resolution site progress photos.
   - **Client**: Real-time project tracking, milestone completion visualizer, photo inspection gallery, and direct quotation/scope change submissions.
2. **AI Schedule & Risk Analysis**:
   - Integrates with Google Gemini API to analyze project progress vs. expected velocity, identifying delay risks and recommending actionable mitigation strategies.
3. **RAG Construction Assistant**:
   - Semantic TF-IDF knowledge base assistant providing instant domain-specific answers on structural standards, concrete curing, permit guidelines, and project inquiries.
4. **Security & Quality Audited**:
   - 0 Bandit security vulnerabilities.
   - 0 ESLint errors/warnings.
   - 0 npm audit security vulnerabilities.
   - Protected against IDOR, SVG XSS, Path Traversal, and CSRF attacks.

---

## Documentation Links

- [Backend Documentation](file:///c:/Users/yoghe/OneDrive/Desktop/Constructor/full_stack_sem_5/backend/README.md)
- [Frontend Documentation](file:///c:/Users/yoghe/OneDrive/Desktop/Constructor/full_stack_sem_5/frontend/README.md)
- [Comprehensive Industry Architecture & Audit Report](file:///c:/Users/yoghe/OneDrive/Desktop/Constructor/full_stack_sem_5/PROJECT_INDUSTRY_STANDARD_REPORT.md)
