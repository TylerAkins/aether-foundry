# Aether Foundry
## Technical Architecture & Product Specification

**Version:** 0.2  
**Status:** Planning (MVP)  
**Repository:** `aetherfoundry`  
**Organization:** Aether Foundry  
**Website:** `https://aetherfoundry.io` *(planned)*

---

# Purpose

Aether Foundry is the parent software company responsible for building, operating, and maintaining software products, SaaS platforms, internal tools, and games.

The Aether Foundry website is more than a marketing site. It is the foundation of the company's internal platform.

Initially, it serves as:

- Company website
- Shared employee identity platform
- Internal portal
- Product launcher

Future features such as Careers, Applicant Tracking, and Employee Management are intentionally deferred.

---

# Core Philosophy

Every engineering decision should prioritize:

1. Simplicity
2. Security
3. Maintainability
4. Scalability
5. User Experience

Avoid premature optimization.

Favor readability over cleverness.

Products should remain loosely coupled.

---

# Branding

Repository assets include:

```text
/public/branding/
    logo.png
    icon.png
```

## logo.png

Primary company logo.

Used for:

- Website header
- Documentation
- GitHub Organization
- Marketing
- Social media

## icon.png

Standalone company emblem.

Used for:

- Favicon
- Browser tabs
- Mobile icons
- Application icons
- Future desktop/mobile applications

---

# Website Pages (MVP)

## Home

Landing page introducing Aether Foundry.

---

## Products & Services

Displays current and future software.

Initially includes:

- KVisaAssistant

Future:

- SaaS products
- Internal tools

---

## Games

Showcases current and future game projects.

Initially this page serves as a roadmap only.

---

## About Us

Company overview.

Mission.

Engineering philosophy.

---

## Employee Login

Allows authenticated employees to access the internal portal.

---

# Website Design

Theme:

- Light mode only

Style:

- Clean
- Professional
- Modern
- Minimal

Requirements:

- Mobile-first
- Responsive
- Accessible
- Fast
- SEO friendly

---

# Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

---

## Backend

- Next.js Route Handlers
- Next.js Server Actions
- TypeScript

---

## Database

PostgreSQL

ORM:

Drizzle ORM

Validation:

Zod

---

## Infrastructure

Ubuntu VPS

Reverse Proxy:

Caddy

Process Manager:

PM2

CI/CD:

GitHub Actions

Source Control:

GitHub

---

## Email

### Human Email

Hosting provider email.

Examples:

```
tyler@aetherfoundry.io
support@aetherfoundry.io
careers@aetherfoundry.io
firstname.lastname@aetherfoundry.io
```

### Transactional Email

Resend

Used for:

- Verification
- Password reset
- Notifications
- System emails

---

# Architecture

```
Aether Foundry
│
├── Public Website
├── Shared Identity
├── Internal Portal
└── Product Launcher
```

Products remain separate applications.

---

# Shared Identity

Aether Foundry owns employee identity.

Products consume employee identity.

Products never create employee accounts.

Future products authenticate employees through Aether Foundry.

---

# KVisaAssistant Launch Token Contract

KVisaAssistant employee launches use a short-lived signed JWT. Aether Foundry
keeps employee sessions and databases private, authorizes product access
server-side, signs a launch token, and redirects employees to KVisaAssistant
with `launch_token` in the query string.

## Version

- Contract version: `kvisa_launch_v1`
- Signing algorithm: `RS256`
- Issuer: Aether Foundry `APP_URL`
- Audience: `kvisa_assistant`
- Lifetime: 2 minutes
- Maximum consumer clock skew: 30 seconds

## Claims

Required registered claims:

- `iss`: Aether Foundry issuer URL
- `aud`: `kvisa_assistant`
- `sub`: employee account id
- `iat`: issued-at timestamp
- `exp`: expiration timestamp
- `jti`: unique launch token id

Required private claims:

- `contractVersion`: `kvisa_launch_v1`
- `employee.id`
- `employee.companyEmail`
- `employee.firstName`
- `employee.middleName`
- `employee.lastName`
- `employee.globalRole`
- `productKey`: `kvisa_assistant`
- `productRole`: assigned KVisaAssistant product role

## Key Distribution

Consumers fetch public keys from:

```text
/api/products/kvisa-assistant/launch-token/jwks
```

The JWKS contains the active public signing key and any previous public keys
kept for rotation. Aether Foundry never returns or sends private key material to
clients or product applications.

## Consumer Validation

KVisaAssistant must reject tokens unless all checks pass:

- `alg` is `RS256`
- `kid` resolves to a known JWKS key
- `iss`, `aud`, `sub`, `iat`, `exp`, `jti`, and `contractVersion` are present
- `aud` equals `kvisa_assistant`
- `contractVersion` equals `kvisa_launch_v1`
- `exp` is unexpired, allowing no more than 30 seconds of clock skew
- `iat` is not unreasonably in the future, allowing no more than 30 seconds of clock skew

KVisaAssistant must treat launch tokens as one-time use. Store accepted `jti`
values until token expiration plus clock skew, and reject any replayed `jti`.
Modified signatures, expired tokens, wrong-audience tokens, unknown-key tokens,
and replayed tokens must fail closed.

## Rotation

Key rotation is intentionally staged so products do not require all-at-once
deployments:

1. Generate a new PKCS#8 RSA private key and key id.
2. Configure Aether Foundry with the new private key and `kid`.
3. Keep old public keys in `KVISA_ASSISTANT_LAUNCH_TOKEN_PREVIOUS_PUBLIC_JWKS`.
4. Let KVisaAssistant refresh JWKS by `kid`.
5. Remove old public keys only after the consumer JWKS cache TTL, token lifetime,
   and clock-skew window have elapsed.

If validation fails, KVisaAssistant should show a sanitized sign-in or launch
failure message and must not call back into Aether Foundry databases or depend
on Aether Foundry session cookies.

Customer authentication remains within each product.

---

# Authentication

Employee authentication consists of:

- Email
- Password
- Optional TOTP
- Email verification
- CAPTCHA where appropriate

Passwords:

- Argon2id
- Secure session cookies

---

# Employee Roles

Global roles:

- Owner
- System Administrator
- Employee

Only Owners and System Administrators may create employee accounts.

---

# Product Roles

Each product defines its own authorization.

Example:

KVisaAssistant

- Owner
- Admin
- Reviewer
- Support

Future products follow the same model.

---

# Internal Portal

Purpose:

Single location for all company employees.

Initial modules:

- Dashboard
- My Profile
- Product Launcher

Future modules:

- Employee Directory
- Documentation
- Company Announcements
- Settings

---

# Product Launcher

Employees launch products from Aether Foundry.

Example:

```
Employee Portal

↓

Launch KVisaAssistant

↓

Signed Authentication Token

↓

KVisaAssistant Admin
```

Employees should authenticate only once.

---

# Employee Profile

Identity

- Company Email
- Personal Email

Personal

- First Name
- Middle Name
- Last Name
- Phone

Employment

- Title
- Department
- Manager
- Start Date
- Employment Status

Developer

- GitHub URL (Required)

---

# Employee Status

- Pending
- Active
- Suspended
- Terminated

Employee records should never be deleted.

---

# Shared Services (Future)

Potential shared services:

- Identity
- Notifications
- Email
- Logging
- Monitoring
- Audit Logs

Products should consume shared services whenever practical.

---

# Security

Requirements:

- HTTPS everywhere
- Secure cookies
- CSRF protection
- Input validation
- SQL parameterization
- Authorization on every protected endpoint
- Principle of least privilege
- Audit logging for privileged actions

Never trust client input.

---

# Infrastructure

Every product should eventually have:

- Dedicated VPS
- Dedicated PostgreSQL database
- Independent deployment
- Independent backups

Failures in one product should not impact another.

---

# Repository Structure

```
/
├── app/
├── components/
├── lib/
├── drizzle/
├── public/
│   └── branding/
├── docs/
├── .github/
├── package.json
└── README.md
```

---

# Coding Standards

- TypeScript Strict Mode
- Feature-first organization
- Small focused components
- Minimal dependencies
- Server-first architecture
- Reusable utilities
- Consistent naming

---

# Documentation

Documentation is part of the product.

Major architectural decisions should be documented.

Documentation should evolve with the application.

---

# MVP Scope

The MVP consists of:

- Public website
- Branding
- Responsive layout
- Shared employee identity foundation
- Employee login
- Internal portal
- Product launcher
- KVisaAssistant integration foundation
- Documentation

---

# Deferred Features

The following features are intentionally **out of scope** for the MVP.

**Do NOT generate GitHub Issues, milestones, implementation tasks, or development tickets for these features until they are explicitly prioritized.**

## Careers

- Careers page
- Public job listings
- Public application forms

## Applicant Tracking

- Application submission
- Resume uploads
- Application reference IDs
- Interview workflow
- Offer workflow
- Rejection workflow
- Hiring workflow

## Employee Lifecycle

- Applicant to employee conversion
- Employee onboarding
- Company email provisioning
- Employee invitations
- Employee offboarding

## HR Features

- Employment history
- Manager hierarchy
- Emergency contacts
- Performance tracking

## Internal Services

- Company announcements
- Employee directory
- Internal documentation portal
- Notification center
- Shared file storage

These features remain part of the long-term vision but should not be implemented or planned during the MVP.

---

# Long-Term Vision

Aether Foundry is the central platform that powers every future product built by the company.

Identity and internal administration remain centralized.

Customer data remains isolated within each product.

The platform should be capable of supporting a single developer today while scaling cleanly to multiple products and future employees without requiring significant architectural changes.
