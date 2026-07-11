# Phrases Detective Backend

Spring Boot backend for registration, login, progress tracking and global leaderboard.

## Requirements

- JDK 17+ for this Spring Boot 4 project
- Maven, or use the included `mvnw.cmd` / `mvnw` wrapper scripts
- MySQL 8

## MySQL

Create the database:

```sql
CREATE DATABASE phrases_detective CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

The app can also create it automatically if the MySQL user has permission, because the default JDBC URL includes `createDatabaseIfNotExist=true`.

Or start MySQL with Docker:

```powershell
docker compose up -d
```

That uses `root` / `lazar2004` and creates `phrases_detective`.

## Configuration

Defaults are in `src/main/resources/application.properties`.

For local development you can run with environment variables:

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/phrases_detective?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="lazar2004"
$env:JWT_SECRET="replace-this-with-a-long-random-secret-at-least-32-chars"
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
.\mvnw.cmd spring-boot:run
```

Frontend connects to `http://localhost:8081/api` by default. Override it with:

```env
VITE_API_URL=http://localhost:8081/api
```

## Start both applications

Start the backend from IntelliJ using `PhrasesDetectiveBackendApplication`, or from this folder:

```powershell
.\mvnw.cmd spring-boot:run
```

Then start the frontend:

```powershell
cmd /c npm run dev
```

Open `http://localhost:5173`. Registration and login are required before playing. Finished games are automatically saved to the authenticated user's progress and global leaderboard.

## API

Public:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/leaderboard?limit=50`
- `GET /api/health`

Authenticated with `Authorization: Bearer <token>`:

- `GET /api/me`
- `GET /api/progress/me`
- `POST /api/progress/games`
- `GET /api/achievements`
- `GET /api/daily-challenge`
- `GET /api/users/search?q=name`
- `GET /api/friends`
- `POST /api/friends/requests`
- `POST /api/friends/requests/{id}/accept`
- `POST /api/friends/requests/{id}/reject`
- `GET /api/matches`
- `POST /api/matches`
- `POST /api/matches/{id}/accept`
- `POST /api/matches/{id}/reject`
- `PUT /api/matches/{id}/questions`
- `POST /api/matches/{id}/score`

### Register

```json
{
  "username": "marko",
  "email": "marko@example.com",
  "password": "secret123"
}
```

### Login

```json
{
  "usernameOrEmail": "marko",
  "password": "secret123"
}
```

### Save game result

```json
{
  "difficulty": "EASY",
  "mode": "SOLO",
  "score": 8,
  "totalQuestions": 10,
  "durationSeconds": 240
}
```

Leaderboard sorts players by `totalScore`, then fewer played games.

Daily challenges are generated automatically for the current date. Completing the required difficulty and score grants the challenge bonus once. Achievements are checked and unlocked after every completed game.

Frontend routes:

- `/login`
- `/`
- `/difficulty/:players`
- `/game/:players/:difficulty`
- `/profile`
- `/achievements`
- `/leaderboard`
- `/friends`
- `/challenge/:difficulty`
- `/match/:id`

Versus matches can only be sent to one accepted friend. The first player opening an accepted match generates and stores one question set in `versus_matches.questions_json`; both participants then play that exact same set.
