# Aether Foundry

Company website, shared employee identity platform, internal portal, and product launcher for Aether Foundry.

## Prerequisites

- [mise](https://mise.jdx.dev/) for the pinned Node.js and pnpm versions

## Quick start

```bash
mise install
pnpm install --frozen-lockfile
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
