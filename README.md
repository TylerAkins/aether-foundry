# Aether Foundry

Company website, shared employee identity platform, internal portal, and product launcher for Aether Foundry.

## Prerequisites

- [mise](https://mise.jdx.dev/) for the pinned Node.js and pnpm versions

## Quick start

```bash
mise install
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Status

The application foundation is scaffolded. The MVP remains planned to include:

- A public company website
- Shared employee authentication and authorization
- An internal employee portal and admin panel
- A product launcher with a KVisaAssistant integration foundation

Careers, applicant tracking, employee lifecycle automation, and HR features remain deferred.

## Planned stack

- Next.js, React, and TypeScript
- Tailwind CSS and shadcn/ui
- PostgreSQL with Drizzle ORM
- Zod validation
- Resend for transactional email
- Caddy, PM2, and an Ubuntu VPS
- GitHub Actions for CI/CD

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the local development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run strict TypeScript checks without emitting files |
| `pnpm test` | Run unit tests once |
| `pnpm test:watch` | Run unit tests in watch mode |
| `pnpm db:generate` | Generate Drizzle migrations from the schema |
| `pnpm db:migrate` | Apply generated Drizzle migrations to PostgreSQL |

## Database

The app expects PostgreSQL through one `DATABASE_URL` environment variable.
Copy `.env.example` to `.env.local` and replace the placeholder password before
running database commands or server routes that touch persistence.

Example local URL:

```env
DATABASE_URL="postgresql://aether_foundry:change-me@localhost:5432/aether_foundry"
```

Create a local database with any PostgreSQL setup you prefer, then run:

```bash
pnpm db:generate
pnpm db:migrate
```

The database health endpoint is available at `/api/health/database`. It reports
only whether the database is available and never returns credentials, hostnames,
driver errors, stack traces, or migration details.

KVisaAssistant launch-token keys are only required when
`KVISA_ASSISTANT_ENABLED=true`. The default local environment keeps the
integration disabled, so the sign-in and portal routes can run without local
crypto material.

## Architecture

- `app/` contains routes, layouts, metadata, and route composition.
- `features/` contains domain capabilities grouped by feature.
- `components/ui/` contains shared shadcn/ui primitives.
- `components/layout/` is reserved for reusable application shells when one is needed.
- `lib/` contains cross-feature utilities and infrastructure adapters.

The application remains a single root deployment until multiple independently deployable applications or shared packages justify a monorepo.

## Documentation

- [Technical architecture and product specification](docs/technical-architecture.md)
- [GitHub issue guide](docs/skills/create-github-issue.md)

Careers, applicant tracking, employee lifecycle automation, HR features, authentication, and data infrastructure are intentionally outside this scaffold.
