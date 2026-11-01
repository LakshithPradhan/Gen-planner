# Evora

**Event Planning Platform**

Evora is a modern event planning platform designed to simplify the planning and management of celebrations through personalized experiences, organized scheduling, and efficient budget management.

## Website Features

- **Event Planning** – Create personalized event plans based on individual preferences.
- **Budget Management** – Organize expenses and manage budgets efficiently.
- **Event Timeline** – Structure activities and schedules for seamless coordination.
- **Vendor Management** – Simplify vendor selection and coordination.
- **Ideas and Inspiration** – Explore themes, concepts, and creative ideas for celebrations.
- **Plan Editor** – Modify and customize event plans interactively.
- **What-If Simulator** – Explore alternative planning scenarios.
- **Plan Sharing and Export** – Share and export event plans.
- **Local fallback** – Generate and edit plans without an API server; configured AI providers are optional.

## Privacy and AI providers

The browser stores the active plan in local storage and share links contain a Base64-encoded copy
of plan details in the URL hash. Anyone with a share link can read its contents. Do not put
personal, contact, or otherwise sensitive details in a plan or share link.

When the optional Express backend is configured with Google Gemini or Anthropic credentials, plan
generation sends event type, date, guest count, budget, city, and planning notes to configured
providers. Anthropic is tried first when configured; Google Gemini may also receive the brief if
Anthropic is unavailable or fails. The event name is applied locally by the server and is not
included in the generation prompt. Chat sends the user instruction and a limited snapshot (event
type/date, guest count, budget, categories, vendor names/statuses, and task titles/statuses). Avoid
putting private details in chat instructions. Without configured providers, the deterministic
local fallback is used.

The Express API is intended for local development or a separately hosted Node service. GitHub Pages
serves only the static browser application; it does not run Express routes, so plan generation and
chat use the local fallback there.

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Backend | Node.js, Express |
| Integrations | Google Gemini, Anthropic Claude |
| Validation | Zod |
| Testing | Vitest |
| Deployment | GitHub Pages (static frontend), Vercel (static frontend configuration) |

## Overview

Evora brings together modern web technologies to deliver a seamless, intuitive, and personalized event planning experience.

## Development and deployment

- `npm install` installs dependencies.
- `npm run dev` starts the Express/Vite development server at `http://localhost:3000`.
- `npm test` runs the automated test suite.
- `npm run typecheck` runs the strict TypeScript check.
- `npm run lint` remains a compatibility alias for `npm run typecheck`; it does not run a separate style linter.
- `npm run build` creates the static production site in `dist`.

The GitHub Actions workflows test and build the project before deployment. Static hosting requires
no API keys; optional provider keys belong only in the environment of a separately hosted Express
backend and must never be added to browser code or committed files. The server uses process-local
rate limits; production deployments with multiple instances should use a shared atomic rate-limit
store and configure trusted proxy handling for the hosting platform.

The default production build targets a site hosted at its domain root (including the Vercel static
configuration). The GitHub Pages workflow overrides Vite's base path to `/Gen-planner/`.

The Node server limits JSON requests to 600kb. API generation is limited to 5 requests per client
per minute and 10 per server instance per minute; chat is limited to 20 per client and 30 per
instance per minute. IP buckets expire after inactivity and are capped in memory. These are
best-effort process-local limits, not a substitute for provider quotas or a shared limit across
instances. For a multi-instance backend, use a shared atomic counter store, configure provider-side
quota limits, and set `TRUST_PROXY_HOPS` only to the exact number of trusted reverse proxies in
front of Express. Do not trust client-supplied forwarding headers directly.

The static site restricts scripts, connections, and resource origins through a Content Security
Policy. Playfair Display is loaded from Google Fonts; inline style attributes are permitted only
because the existing visualizations use dynamic React styles. Express adds equivalent response
headers when it serves the app. GitHub Pages cannot set HTTP security headers, so its policy is
provided by an HTML meta tag; directives that only work as response headers (such as
`frame-ancestors`) cannot be enforced there.