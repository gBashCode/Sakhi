# Sakhi AI Backend

This is the backend service for the **Sakhi** project, built using FastAPI, SQLAlchemy, and PostgreSQL/SQLite. It provides authentication, offline-first visit synchronization, and a dashboard alerting system for health workers (ASHA/ANM/PHC).

## Features Implemented

### 1. Database & Models
- **Database Connection (`app/db/session.py`)**: Configured SQLAlchemy to connect to the database. Supports PostgreSQL for production, but currently configured with an SQLite fallback (`sakhi.db`) to enable seamless local development without needing Docker.
- **Data Models (`app/models/`)**: 
  - **User**: Stores health workers with roles (`ASHA`, `ANM`, `PHC`) and hashed PINs.
  - **Patient**: Stores patient demographic and pregnancy details.
  - **Visit**: Stores routine health checkup details synced from the offline mobile app. Uses the `JSON` column type for the symptoms array to guarantee cross-compatibility between local SQLite testing and remote PostgreSQL deployment.

### 2. Authentication System
- **Security (`app/core/security.py`)**: JWT token generation and bcrypt password hashing using `passlib`. (We pinned `bcrypt<4.0.0` to resolve a known compatibility issue with passlib).
- **Auth Endpoints (`app/api/v1/endpoints/auth.py`)**: Exposes `POST /api/v1/auth/login` allowing users to sign in with their phone number and PIN, returning a secure JWT Bearer token.
- **Dependencies (`app/api/deps.py`)**: `get_current_user` extracts and validates the JWT token to secure protected routes and map requests to specific users.

### 3. Offline-First Sync API
- **Sync Endpoints (`app/api/v1/endpoints/sync.py`)**: 
  - `POST /api/v1/sync`: Accepts bulk offline data arrays (e.g., visits) and synchronizes them to the central database.
  - Deduplicates records using unique UUID `client_id`s to prevent double-entries from flaky connections.
  - Checks visit parameters and automatically dispatches real-time alerts to the Redis queue if `risk_level` is marked as high. (This uses a graceful fallback / `fakeredis` mock for local development when Redis isn't running).

### 4. Dashboard & Alerts
- **Dashboard Endpoints (`app/api/v1/endpoints/dashboard.py`)**:
  - `GET /api/v1/alerts/phc`: Retrieves live, high-risk patient alerts from Redis filtered by the logged-in user's `village_id`.
  - `GET /api/v1/patients/due`: Returns lists of patients due for follow-ups (currently returning quick mock data for the hackathon).

### 5. Deployment Setup
- **Alembic Setup**: Initialized Alembic (`alembic/`) for future schema migrations.
- **Hackathon Auto-Deploy (`app/main.py`)**: Added `Base.metadata.create_all()` into the global app init to instantly auto-create the database schema on cloud deployment, bypassing the need for manual migrations right now.
- **Seeding (`app/core/seed.py`)**: A handy script to initialize the first test user (`9999999999` / `1234`) onto any fresh deployed database.
- **Dockerization**: Created the `Dockerfile` and updated `requirements.txt` to prepare for seamless one-click container deployment on platforms like Render.com.

## Getting Started Locally

1. **Activate Virtual Environment:**
   ```powershell
   .\venv\Scripts\activate
   ```

2. **Seed Initial Data:**
   ```powershell
   python -m app.core.seed
   ```
   *(This creates an ASHA user with Phone: `9999999999`, PIN: `1234`)*

3. **Run the Server:**
   ```powershell
   uvicorn app.main:app --reload
   ```

4. **API Documentation:**
   Visit `http://localhost:8000/docs` to interact with the Swagger UI and test the endpoints directly.

## Cloud Deployment (Render.com)

1. Connect this GitHub repository to Render as a "New Web Service".
2. Select the **Docker** environment.
3. Add the necessary environment variables:
   - `DATABASE_URL` (e.g., your managed PostgreSQL URI)
   - `REDIS_URL` (optional, for the live alerts queue)
4. Once deployed, run the seed script via the Render Web Shell to create the first login user.
