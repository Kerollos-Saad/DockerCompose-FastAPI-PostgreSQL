# Backend

The backend is a FastAPI service backed by PostgreSQL through SQLAlchemy. Docker Compose builds the API from this folder, makes it available on port `8000`, and supplies its database connection string.

## Run with Docker Compose

From the project root:

```powershell
docker compose up --build backend
```

Compose also starts PostgreSQL and waits for it to be healthy before starting the API. Start the entire app, including the frontend, with `docker compose up --build`. See the [project README](../README.md).

Once running:

- API: <http://localhost:8000>
- Interactive API documentation: <http://localhost:8000/docs>

## Run the API separately

For local development, Python dependencies are listed in `requirements.txt`. The API still requires a reachable PostgreSQL database; set `DATABASE_URL` to its SQLAlchemy connection URL before starting Uvicorn.

```powershell
Set-Location D:\Docker\DockerCompose\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

For normal use, prefer Docker Compose so the database, connection settings, and service startup order are configured together.
