# Todo App

A small Todo application made up of three Docker Compose services:

```text
Browser
  ├── http://localhost:8081 → Angular frontend (Nginx)
  └── http://localhost:8000 → FastAPI backend → PostgreSQL
                                      │
                                      └── postgres:5432
```

Compose builds the Angular and FastAPI images and starts PostgreSQL. The backend waits for PostgreSQL to pass its health check before starting. PostgreSQL data is kept in the `postgres-data` volume when containers are stopped or recreated.

## Run the application

Install Docker Desktop, start its Docker engine, then run from the project root:

```powershell
docker compose up --build
```

Open:

- Frontend: <http://localhost:8081>
- API documentation: <http://localhost:8000/docs>

Stop the services with `Ctrl+C`, or run `docker compose down` from another terminal. The database volume is retained. **Do not use `docker compose down -v` unless you intend to delete the stored database data.**

## View service logs

```powershell
docker compose logs -f
```

## Run frontend or backend separately

- For Angular development, see [frontend/README.md](./frontend/README.md).
- For FastAPI and database setup, see [backend/README.md](./backend/README.md).
