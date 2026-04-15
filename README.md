# Calendra — Full Stack Calendar Application

A production-ready calendar app built with **React**, **Django REST Framework**, and **SQLite/PostgreSQL**.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, React Router v6, Axios, date-fns      |
| Backend   | Django 4, Django REST Framework, SimpleJWT      |
| Database  | SQLite (dev) / PostgreSQL (prod)                |
| Auth      | JWT (access + refresh tokens, blacklisting)     |
| Storage   | Django media files (local filesystem)           |

---

## Features Implemented

### Authentication
- Register with email + password
- Login with JWT tokens (access + refresh)
- Token auto-refresh via Axios interceptor
- Secure logout with token blacklisting
- Change password (requires current password)
- Password reset via email link (UID + signed token)

### Calendar
- Month view — grid with event chips
- Week view — hourly time grid with positioned events
- Navigate forward/back, jump to Today
- Click any day or use "+ New Event" to create events

### Events
- Create with title, description, start/end datetime, color
- View full details in modal
- Edit (owners + users with edit permission)
- Delete (owners only)
- 8 color options per event

### Sharing
- Share any event with any registered user by email
- Assign `read` or `edit` permissions per user
- Owner can revoke access at any time
- Shared events appear on recipient's calendar

### File Attachments
- Upload files to any event (owners + edit-permission users)
- View attached files with name, size, uploader
- Download attached files
- Delete attachments (owner or uploader)

### Security
- All API endpoints require JWT Bearer token
- Object-level permissions (can't access others' events)
- Refresh tokens are blacklisted on logout
- Password reset tokens are time-limited (1 hour)

---

## Project Structure

```
calendar-app/
├── backend/
│   ├── config/
│   │   ├── settings.py       # Django settings
│   │   └── urls.py           # Root URL conf
│   ├── accounts/
│   │   ├── models.py         # Custom User model (UUID pk, email login)
│   │   ├── serializers.py    # Register, Profile, ChangePassword
│   │   ├── views.py          # Auth views
│   │   └── urls.py           # /api/auth/ routes
│   ├── events/
│   │   ├── models.py         # Event, EventShare, EventAttachment
│   │   ├── serializers.py    # Nested serializers
│   │   ├── views.py          # CRUD + share + file endpoints
│   │   ├── permissions.py    # IsOwnerOrShared custom permission
│   │   └── urls.py           # /api/events/ routes
│   └── manage.py
│
├── frontend/
│   └── src/
│       ├── api/
│       │   └── axios.js          # Axios instance + JWT interceptor
│       ├── context/
│       │   └── AuthContext.js    # Global auth state
│       ├── components/
│       │   ├── events/
│       │   │   ├── EventModal.js        # Create/Edit modal
│       │   │   └── EventDetailModal.js  # View/Share/Files modal
│       │   └── shared/
│       │       ├── Sidebar.js           # Navigation sidebar
│       │       └── ProtectedRoute.js    # Auth guard
│       ├── pages/
│       │   ├── CalendarPage.js   # Main calendar (month + week views)
│       │   ├── Settings.js       # Profile + change password
│       │   ├── Login.js
│       │   ├── Register.js
│       │   ├── ForgotPassword.js
│       │   └── ResetPassword.js
│       └── App.js                # Router + layout
│
├── start-backend.sh
├── start-frontend.sh
└── README.md
```

---

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm 8+

### Terminal 1 — Backend
```bash
cd calendar-app
chmod +x start-backend.sh
./start-backend.sh
```
The script will:
1. Create a Python virtual environment
2. Install all pip dependencies
3. Run database migrations
4. Create a default admin user
5. Start Django on http://localhost:8000

**Default admin:** `admin@calendra.app` / `admin123`

### Terminal 2 — Frontend
```bash
cd calendar-app
chmod +x start-frontend.sh
./start-frontend.sh
```
Opens React on http://localhost:3000

---

## API Reference

### Auth Endpoints (no token required)
| Method | Endpoint                          | Description            |
|--------|-----------------------------------|------------------------|
| POST   | /api/auth/register/               | Create account         |
| POST   | /api/auth/login/                  | Get JWT tokens         |
| POST   | /api/auth/token/refresh/          | Refresh access token   |
| POST   | /api/auth/password-reset/         | Request reset email    |
| POST   | /api/auth/password-reset/confirm/ | Confirm reset          |

### Auth Endpoints (token required)
| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| POST   | /api/auth/logout/         | Blacklist token      |
| GET    | /api/auth/profile/        | Get current user     |
| PATCH  | /api/auth/profile/        | Update profile       |
| POST   | /api/auth/change-password/| Change password      |
| GET    | /api/auth/users/search/   | Search users by email|

### Event Endpoints (token required)
| Method | Endpoint                                  | Description           |
|--------|-------------------------------------------|-----------------------|
| GET    | /api/events/                              | List my events        |
| POST   | /api/events/                              | Create event          |
| GET    | /api/events/{id}/                         | Get event detail      |
| PATCH  | /api/events/{id}/                         | Update event          |
| DELETE | /api/events/{id}/                         | Delete event          |
| POST   | /api/events/{id}/share/                   | Share with user       |
| DELETE | /api/events/{id}/share/                   | Remove share          |
| POST   | /api/events/{id}/attachments/             | Upload file           |
| DELETE | /api/events/{id}/attachments/{att_id}/    | Delete file           |

### Query Parameters for GET /api/events/
- `?start=<ISO datetime>` — filter events starting after this time
- `?end=<ISO datetime>` — filter events starting before this time

---

## Switching to PostgreSQL

1. Install PostgreSQL and create a database:
```sql
CREATE DATABASE calendra;
CREATE USER calendra_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE calendra TO calendra_user;
```

2. Update `backend/config/settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'calendra',
        'USER': 'calendra_user',
        'PASSWORD': 'yourpassword',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

3. Re-run migrations:
```bash
python manage.py migrate
```

---

## Environment Variables (Production)

Create `backend/.env`:
```env
SECRET_KEY=your-very-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DB_NAME=calendra
DB_USER=calendra_user
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

---

## Design System

The UI uses a dark theme with the **Syne** display font and **DM Sans** body font.

| Token         | Value                    |
|---------------|--------------------------|
| Background    | `#0c0c0f`                |
| Surface       | `#131318`                |
| Accent        | `#7c6af7` (indigo-violet)|
| Text          | `#e8e8f0`                |
| Muted text    | `#7878a0`                |
| Border        | `#2a2a38`                |

---

## Password Reset Flow (Development)

Since `EMAIL_BACKEND = console`, reset emails print to the **Django terminal**.

1. Submit email at `/forgot-password`
2. Copy the URL from the Django terminal output
3. Open the URL in browser → `/reset-password/{uid}/{token}/`
4. Set your new password

For production, configure a real SMTP server (SendGrid, AWS SES, etc.).
