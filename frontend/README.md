# Frontend

The frontend is a standalone Angular application. In Docker Compose it is built into static files and served by Nginx on <http://localhost:8081>. It sends API requests to the FastAPI backend at <http://localhost:8000>.

## Run with Docker Compose

From the project root:

```powershell
docker compose up --build frontend
```

The backend and PostgreSQL are also part of the application. To start all services together, use `docker compose up --build` from the root; see the [project README](../README.md).

## Run Angular development server

Install Node.js and npm, then run:

```powershell
Set-Location D:\Docker\DockerCompose\frontend
npm ci
npm start
```

Open <http://localhost:4200>. The API at <http://localhost:8000> must be running separately for Todo requests to work.
