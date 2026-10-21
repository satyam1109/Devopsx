# Render backend deployment

This deploys only the Spring Boot API. The React frontend is a separate deployment.

## Current demo configuration

- Repository: `https://github.com/satyam1109/Devopsx`, branch `main`.
- Runtime: Docker with Java 21, non-root runtime user, and a multi-stage build.
- Region: Singapore; database and API must be in the same region.
- Plans: Free web service and Free PostgreSQL 17, explicitly selected by the project owner.
- Runtime profiles: `production,render`.
- Bind address: `0.0.0.0`; listening port comes from Render's `PORT`.
- Health check: `/api/health`, HTTP 200 with `{"status":"UP"}` only when the database is reachable.
- Database: Render Postgres, accessed over the internal connection. Credentials stay in Render environment settings and are never committed.
- Schema: Flyway migration `db/migration/postgresql/V1__initial_content_store.sql`.
- Dummy content: enabled with `SEED_DUMMY_CONTENT=true` for this demo. Seeding only runs on an empty content table.
- Auto deployment is off so a future push does not automatically change the public API.

Render recommends Docker for JVM languages and requires binding public services to `0.0.0.0` and `PORT`:
https://render.com/docs/docker
https://render.com/docs/web-services#port-binding

## Deployment

1. Create a **Free PostgreSQL 17** database named `devopsx-db` in Singapore. Keep external database access disabled after setup.
2. Open Render **Blueprints → New Blueprint Instance** and select this repository.
3. Use the root `render.yaml`. It creates only the free API service and references the existing database by name, including its managed password. It does not create a second database.
4. Confirm all resources use the **Free** plan before applying.
5. Wait for the deploy to become Live, then verify `/api/health`, `/api/catalog`, and `/api/session`.

Manual web service equivalent:

| Setting        | Value        |
| -------------- | ------------ |
| Runtime        | Docker       |
| Branch         | main         |
| Root directory | backend      |
| Dockerfile     | ./Dockerfile |
| Docker context | .            |
| Plan           | Free         |
| Region         | Singapore    |
| Health check   | /api/health  |
| Auto deploy    | Off          |

If creating a web service through the Render integration instead of a Blueprint, use `backend/Dockerfile` and `backend` for the Dockerfile path and context relative to the repository root.

Set these runtime environment variables from the existing database's internal connection details:

| Name                   | Value                                                                             |
| ---------------------- | --------------------------------------------------------------------------------- |
| SPRING_PROFILES_ACTIVE | production,render                                                                 |
| DB_HOST                | Internal Postgres host                                                            |
| DB_PORT                | 5432                                                                              |
| DB_NAME                | Database name                                                                     |
| DB_USERNAME            | Database user                                                                     |
| DB_PASSWORD            | Managed database password                                                         |
| SEED_DUMMY_CONTENT     | true                                                                              |
| CORS_ALLOWED_ORIGINS   | Leave absent until the frontend origin is known; later use its exact https origin |

Never use the `demo` profile on the public service. It permits local role switching. The production deployment keeps admin, preferences, progress, and review writes protected. `/api/demo/session` is disabled. Published dummy catalog content and the health endpoint are public. Real account authentication and per-user progress must be implemented before enabling learner/admin features for public use. This initial API deployment does not change the local demo's behavior.

Use a same-origin frontend API proxy when the frontend is deployed; session cookies remain Secure, HttpOnly and SameSite=Lax. If direct cross-origin browser requests are needed, explicitly configure `CORS_ALLOWED_ORIGINS` and decide the corresponding authentication/cookie policy during frontend deployment. Wildcard origins are not accepted.

## Free tier lifecycle

This is an internet-hosted demo. Render's free web service can sleep when idle and free Postgres expires 30 days after creation. Free Postgres has no managed backups. Upgrade or export/replace the database before expiry. Do not enter private or irreplaceable material in this demo.

https://render.com/docs/free

## Local verification

The default local development profile still uses the existing H2 database. Verify it with:

```sh
./mvnw test
```

To verify PostgreSQL, start a disposable test database, then run the opt-in test profile. Never supply a production database here. The test profile requires a loopback Postgres URL and writes fixtures:

```sh
docker run --detach --name devopsx-render-postgres-test \
  -e POSTGRES_DB=devopsx_testing \
  -e POSTGRES_USER=devopsx_testing \
  -e POSTGRES_PASSWORD=local-disposable-test-only \
  -p 127.0.0.1:55432:5432 postgres:17-alpine

DEVOPSX_TEST_DATABASE_URL=jdbc:postgresql://127.0.0.1:55432/devopsx_testing \
DEVOPSX_TEST_DATABASE_USER=devopsx_testing \
DEVOPSX_TEST_DATABASE_PASSWORD=local-disposable-test-only \
./mvnw -Ppostgres-integration verify
```

Build the Render image from the repository root:

```sh
docker build --platform linux/amd64 -t devopsx-backend:render-test backend
```

The Docker build also runs the standard backend tests. PostgreSQL integration tests run separately against the disposable database.
