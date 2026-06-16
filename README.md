# template-express-ts

Production-ready Express.js template with TypeScript, PostgreSQL, Redis, and WebSocket.

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Express 5 |
| Language | TypeScript 6 |
| Database | PostgreSQL + Drizzle ORM |
| Cache | Redis (ioredis) |
| WebSocket | ws |
| Logger | Pino + pino-http |
| Security | Helmet, CORS, express-rate-limit |

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL
- Redis

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy env file and fill in the values
cp .env.example .env.local

# Run database migrations
pnpm db:migrate

# Start development server (hot reload)
pnpm dev
```

## Environment Variables

Create a `.env.local` file at the project root:

```env
# App
APP_ENV=local
APP_PORT=3080
APP_LOG_LEVEL=info

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=db-example
DB_USER=postgres
DB_PASSWORD=
DB_SCHEMA=public
DB_SSL=disable

# Redis
REDIS_URL=redis://localhost:6379
```

> In production, `DB_PASSWORD` is required or the server will refuse to start.

## Scripts

```bash
pnpm dev           # Development with hot reload
pnpm build         # Compile TypeScript → dist/
pnpm start         # Run compiled output

pnpm db:generate   # Generate migration files from schema changes
pnpm db:migrate    # Apply pending migrations
pnpm db:studio     # Open Drizzle Studio (visual DB browser)
```

## Project Structure

```
src/
├── cmd/server/         # Entry points
│   ├── main.ts         # Server startup, graceful shutdown
│   └── app.ts          # Express app & middleware wiring
├── config/             # Environment config loader (dotenv)
├── bootstrap/          # Singleton initialisers
│   ├── database.ts     # PostgreSQL pool (Drizzle)
│   ├── redis.ts        # Redis client (ioredis)
│   └── websocket.ts    # WebSocket server + pub/sub bridge
├── middleware/
│   ├── middleware.ts   # notFoundHandler, errorHandler
│   ├── logger/         # pino-http request logger
│   └── security/       # helmet, cors, rate limiter
├── router/             # initRouterV1(app) — mounts all /api/v1 routes
├── module/
│   └── user/           # Feature module example
│       ├── routes/     # Route definitions
│       ├── controller/ # HTTP layer (parse req, send res)
│       ├── service/    # Business logic
│       ├── repository/ # Drizzle queries
│       ├── dto/        # Request / response interfaces
│       └── constant/   # Error messages, success messages
└── pkg/
    ├── logger/         # Pino logger instance
    ├── cache/          # Redis cache helpers
    ├── events/         # In-process event bus (EventEmitter)
    └── utils/          # Shared: error classes, response helpers, HTTP status
drizzle/
├── schema/             # Table definitions
└── mixin/              # Reusable column groups (e.g. auditFields)
```

## API

### Health Check

```
GET /health
```

```json
{ "status": "ok", "env": "local", "timestamp": "2026-01-01T00:00:00.000Z" }
```

### User

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/user/list` | List users (paginated) |
| `GET` | `/api/v1/user/:uid` | Get user by UID |
| `POST` | `/api/v1/user` | Create user |
| `PUT` | `/api/v1/user/:uid` | Update user |
| `DELETE` | `/api/v1/user/:uid` | Soft delete user |

Query params for list: `page`, `limit`, `keyword`.

### Response Envelope

All endpoints return the same shape:

```json
// Success
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": { "status": 200, "timestamp": "..." }
}

// Error
{
  "success": false,
  "message": "...",
  "errors": { "reason": "..." },
  "meta": { "status": 400, "timestamp": "..." }
}
```

## WebSocket Pub/Sub

Connect to the WebSocket server at `ws://localhost:3080`.

### Subscribe to a topic

```json
{ "event": "subscribe", "payload": { "topic": "orders" } }
```

### Unsubscribe from a topic

```json
{ "event": "unsubscribe", "payload": { "topic": "orders" } }
```

### Server responses

```json
{ "event": "subscribed",   "payload": { "topic": "orders" } }
{ "event": "unsubscribed", "payload": { "topic": "orders" } }
{ "event": "orders",       "payload": { ... } }
{ "event": "error",        "payload": { "message": "..." } }
```

### Push from server (service / controller)

```ts
import { publishToTopic } from "#/bootstrap/websocket";

publishToTopic("orders", { id: 1, status: "created" });
```

## Adding a New Module

1. Create `src/module/<name>/` with: `routes`, `controller`, `service`, `repository`, `dto`, `constant`
2. Register in `src/router/router.ts`:
   ```ts
   router.use("/api/v1/<name>", <name>Routes);
   ```
3. Add schema in `drizzle/schema/<name>.ts`, then run `pnpm db:generate && pnpm db:migrate`

## Cache Helper

```ts
import { withCache, cacheDel } from "#/pkg/cache/cache";

// Cache-aside: hit cache first, miss → fetch DB → store
const user = await withCache(`user:${uid}`, 300, () => repo.findByUID(uid));

// Invalidate after update
await cacheDel(`user:${uid}`);
```
