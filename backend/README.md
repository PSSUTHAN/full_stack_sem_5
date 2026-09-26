# Engineers Veedu — Backend API (Django REST Framework + MySQL)

Enterprise-grade, modular Django REST Framework backend powering the **Engineers Veedu** Construction Management Platform. Provides robust role-based access control (RBAC), multi-tenant project tracking, daily site operations logging, client quotation management, AI-driven construction analytics with Google Gemini, and a RAG (Retrieval-Augmented Generation) semantic chatbot.

---

## 1. Architecture & Tech Stack

- **Web Framework**: Django 4.2+ & Django REST Framework (DRF)
- **Database**: MySQL 8.x / MariaDB (`constructor_db`)
- **Authentication**: Stateless JSON Web Tokens (JWT) using `rest_framework_simplejwt`
- **Security & Authorization**: Custom permissions, IDOR mitigations, object-level role authorization
- **File Handling**: Whitelisted extension validation (JPEG, PNG, WEBP), magic byte verification, MIME validation, SVG execution prevention, path traversal defense
- **AI & Analytics**: Google Gemini Flash API (`google-genai`), Scikit-Learn TF-IDF Cosine Similarity for RAG
- **CORS**: `django-cors-headers` restricted to trusted origins (`http://localhost:5173`, `http://127.0.0.1:5173`)
- **Code Quality & Compliance**: Bandit (0 security vulnerabilities), Flake8 (0 warnings/errors), Pylint (9.97/10)

---

## 2. Project Directory Structure

```
backend/
├── manage.py                   # Django CLI utility
├── requirements.txt             # Python dependencies
├── .env.example                 # Template for local environment variables
├── .gitignore                   # Ignores .env, uploads, pycache, db files
├── README.md                    # Backend documentation
├── knowledge_base.json          # Semantic knowledge base for construction RAG
│
├── config/                      # Django project configuration root
│   ├── __init__.py
│   ├── asgi.py
│   ├── wsgi.py
│   ├── settings.py              # Security settings, database, JWT, CORS, apps
│   ├── urls.py                  # Master routing with api/ prefix
│   └── views.py                 # System health check & secure file uploads
│
├── apps/                        # Decoupled Django applications
│   ├── accounts/                # User authentication, RBAC, JWT tokens, profile
│   ├── projects/                # Construction project lifecycle & milestone tracker
│   ├── daily_logs/              # Site supervisor logs, checklist verification, breakdowns
│   ├── client_requests/         # Client quotations, scope enquiries & approvals
│   ├── ai_analysis/             # Schedule pace evaluation & Gemini schedule health insights
│   └── chatbot/                 # Vector-less TF-IDF RAG construction assistant
│
└── uploads/                     # Secure local storage for inspection photos & logs
```

---

## 3. Environment Configuration

Create a `.env` file in the `backend/` directory based on `.env.example`:

```ini
# Django Core Settings
SECRET_KEY=your-production-strength-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# MySQL Database Configuration
DB_NAME=constructor_db
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306

# Google Gemini API
GEMINI_API_KEY=your-google-gemini-api-key
```

---

## 4. Installation & Local Setup

### Step 1: Set Up Python Virtual Environment
```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### Step 2: Install Python Packages
```bash
pip install -r requirements.txt
```

### Step 3: MySQL Database Initialization
Ensure your MySQL server is running, then create the database:
```sql
CREATE DATABASE IF NOT EXISTS constructor_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 4: Run Migrations
```bash
python manage.py migrate
```

### Step 5: (Optional) Create Administrative Superuser
```bash
python manage.py createsuperuser
```

### Step 6: Start Development Server
```bash
python manage.py runserver 127.0.0.1:5000
```
Backend will be available at: `http://127.0.0.1:5000/`

---

## 5. API Reference Summary

All API endpoints are mounted under `/api/`.

### Authentication & Users (`/api/accounts/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/accounts/register/` | Register a new user (`client`, `contractor`, or `site_engineer`) | No |
| `POST` | `/api/accounts/login/` | Obtain JWT `access` and `refresh` tokens | No |
| `POST` | `/api/accounts/token/refresh/` | Refresh expired access token | No |
| `GET` | `/api/accounts/profile/` | Fetch authenticated user profile | Yes (JWT) |
| `GET` | `/api/accounts/engineers/` | List all available site engineers | Yes (Contractor/Admin) |

### Projects (`/api/projects/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/projects/` | List projects relevant to user's role (IDOR protected) | Yes (JWT) |
| `POST` | `/api/projects/` | Create a new construction project | Yes (Contractor/Admin) |
| `GET` | `/api/projects/{id}/` | Get project detail, WBS components & milestones | Yes (JWT) |
| `PUT`/`PATCH` | `/api/projects/{id}/` | Update project progress, dates, or status | Yes (Contractor/Admin) |
| `DELETE` | `/api/projects/{id}/` | Remove project record | Yes (Contractor/Admin) |

### Daily Site Logs (`/api/daily_logs/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/daily_logs/` | List daily logs for assigned project | Yes (JWT) |
| `POST` | `/api/daily_logs/` | Submit a daily site log with inspections & checklists | Yes (Engineer/Contractor) |
| `GET` | `/api/daily_logs/{id}/` | View specific daily log details | Yes (JWT) |

### Client Requests & Quotations (`/api/client_requests/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/client_requests/` | View client requests (filtered by client ID for clients) | Yes (JWT) |
| `POST` | `/api/client_requests/` | Submit new quotation/enquiry request | Yes (Client/Contractor) |
| `PATCH` | `/api/client_requests/{id}/` | Update status (`Approved`, `Under Review`, `Rejected`) | Yes (Contractor/Admin) |

### AI Analysis & Gemini Insights (`/api/ai_analysis/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/ai_analysis/analyze/` | Calculate schedule health, delay risk, and Gemini analysis | Yes (JWT) |

### Construction RAG Chatbot (`/api/chatbot/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/chatbot/chat/` | Ask questions to the construction knowledge assistant | No / Optional JWT |

### File Uploads & Health (`/api/`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health/` | System status & database connectivity check | No |
| `POST` | `/api/upload/` | Securely upload inspection photo (JPEG, PNG, WEBP) | Yes (JWT) |
| `GET` | `/uploads/{filename}` | Serve uploaded file with security headers | No (Static media) |

---

## 6. Security & Audit Verification

- **Bandit SAST**: Clean (0 High, 0 Medium, 0 Low issues).
- **Flake8**: 100% compliant with PEP 8 standards.
- **Pylint Score**: 9.97/10.
- **IDOR Protection**: All list and detail views filter records against `request.user` role (`client`, `contractor`, `site_engineer`).
- **File Upload Security**:
  - File extension whitelist: `.png`, `.jpg`, `.jpeg`, `.webp`.
  - SVG upload is explicitly rejected to eliminate SVG XSS attack vectors.
  - Path traversal defense: `os.path.basename` sanitation prevents `../` arbitrary writes.
  - Direct file execution disabled in upload directory.
