# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# currentDate

Today's date is 2026-03-19.

---

## Component Development Rules

### UI Components (Shadcn First)

**ALWAYS check `src/components/ui/` for existing components before creating custom ones.**

Available components:

- Layout: `card`, `separator`, `sheet`, `dialog`, `sidebar`, `accordion`, `collapsible`, `resizable`, `scroll-area`
- Forms: `button`, `input`, `textarea`, `select`, `checkbox`, `switch`, `radio-group`, `slider`, `combobox`, `command`, `calendar`, `input-otp`
- Feedback: `alert`, `alert-dialog`, `toast` (sonner), `spinner`, `skeleton`, `progress`, `tooltip`, `popover`, `hover-card`
- Navigation: `tabs`, `dropdown-menu`, `navigation-menu`, `menubar`, `context-menu`, `breadcrumb`, `pagination`
- Data: `table`, `badge`, `avatar`, `chart`, `carousel`
- Misc: `button-group`, `field`, `item`, `kbd`, `label`, `empty`, `aspect-ratio`, `direction`

**When you need a new UI component:**

1. First, check if it exists in `src/components/ui/`
2. If not, use `bunx --bun shadcn@latest add <component>` to install
3. Only create custom components when no shadcn equivalent exists

### Frontend Design Skill

**For creating new UI components, pages, or layouts, use the `frontend-design` skill:**

- Invoke with: `@.claude/skills/frontend-design` or `@.agent/skills/frontend-design`
- This ensures consistent, high-quality, production-grade interfaces

---

## Layout & Spacing Rules

### Container Widths

```
max-w-7xl    ← Default for main content areas
max-w-4xl    ← For focused content (forms, articles)
max-w-2xl    ← For narrow content (settings, profile)
```

### Horizontal Padding

```
px-6                    ← Default container padding
max-sm:px-4             ← Mobile responsive (smaller screens)
```

**Example container:**

```tsx
<div className="mx-auto max-w-7xl px-6 max-sm:px-4">{/* content */}</div>
```

### Spacing Scale (Even Numbers Only)

```
gap-2, gap-4, gap-6, gap-8    ← Component gaps
p-2, p-4, p-6, p-8            ← Padding
m-2, m-4, m-6, m-8            ← Margins
space-y-2, space-y-4, etc.    ← Vertical spacing
```

**Avoid odd numbers** (1, 3, 5, 7) for spacing — use the even scale for visual consistency.

### Section Spacing

```tsx
// Page sections
<section className="py-6 md:py-8">

// Component spacing
<div className="space-y-4">

// Card internal padding
<div className="p-6">
```

---

## Code Style

### Imports

- Use `@/` alias for imports from `src/`
- Group imports: React/Next → External → Internal → Types

### Server Actions

- All server actions go in `src/actions/`
- Use `"use server"` directive
- Always validate input with Zod

### Database

- Use Drizzle ORM from `src/db/`
- Schema definitions in `src/db/schema/`
- Migrations via `bun run db:generate && bun run db:migrate`

### Authentication

- Better Auth configured in `src/lib/auth.ts`
- Use `requireUser()` from `src/actions/auth/session.ts` for protected routes

---

## Project Context

Quark is a multi-agent orchestration platform where humans collaborate through their AI agents.

**Tech Stack:**

- Framework: Next.js 16 (App Router)
- Database: Neon (Postgres) + pgvector
- ORM: Drizzle
- Auth: Better Auth (magic link/OTP)
- UI: Shadcn + Tailwind v4
- Runtime: Bun

**Key Directories:**

- `src/app/` — Next.js app router pages
- `src/actions/` — Server actions
- `src/components/ui/` — Shadcn components
- `src/db/` — Database schema and client
- `src/lib/` — Utilities (auth, email, utils)
