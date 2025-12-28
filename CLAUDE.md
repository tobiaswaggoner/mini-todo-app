# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mini Todo Planner - a German-language task planning app with dual views: backlog management and daily planner with timeline scheduling. Built with Next.js 14 App Router, React 18, TypeScript, and Tailwind CSS v4.

## Commands

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm lint     # Run ESLint
pnpm start    # Start production server
```

Note: Build ignores TypeScript and ESLint errors (configured in next.config.mjs).

## Deployment (Vercel)

Project is linked to Vercel. Use the Vercel CLI for deployment management:

```bash
vercel ls                 # List recent deployments with status
vercel logs <url>         # View build/runtime logs
vercel inspect <url>      # Deployment details
vercel --prod             # Deploy to production
vercel env pull           # Pull environment variables to .env.local
```

Deployments trigger automatically on push to main.

## Database (Supabase)

Project "Internal" (ref: `vcpwmusyjpdbkxxmlbry`) - shared Supabase instance for internal apps. This app uses schema `mini_todo`.

```bash
npx supabase projects list              # List projects
npx supabase link --project-ref <id>    # Link to project
npx supabase db push                    # Apply migrations to remote
npx supabase db pull                    # Pull remote schema
npx supabase gen types typescript --linked > lib/database.types.ts  # Generate TS types
npx supabase start                      # Local Supabase (Docker)
npx supabase stop                       # Stop local instance
```

## Architecture

### State Management
Data persists in Supabase with Row Level Security (RLS). Each user sees only their own data.

**Tables (schema `mini_todo`):**
- `todos` - Task items with sort_order
- `user_settings` - View preference, start time, available hours
- `category_colors` - Category-to-color mappings

**Hooks:**
- `useTodos()` - CRUD for todos
- `useSettings()` - User preferences
- `useCategoryColors()` - Color mappings

### Authentication
OAuth via Supabase Auth (Google + GitHub). AuthProvider wraps the app in `layout.tsx`.

**Test Account:**
- Email: `claude@netzalist.de`
- Password: `password`

### Component Hierarchy
```
app/layout.tsx (ThemeProvider + AuthProvider)
  └── app/page.tsx (UserMenu + ThemeToggle)
      └── app/todo-app-client.tsx (main state holder, view switching)
          ├── components/backlog-view.tsx (task list with drag-drop)
          │   ├── components/sortable-todo-item.tsx
          │   ├── components/compact-daily-planner.tsx
          │   └── components/edit-todo-dialog.tsx
          └── components/daily-planner-view.tsx (timeline scheduling)
```

### Dual-View Pattern
- **Backlog View**: Drag-and-drop task list (dnd-kit), CRUD operations, import/export JSON
- **Daily Planner View**: Visual timeline, fixed-time appointments, auto-fills flexible tasks into free slots

### Data Types (lib/types.ts)
```typescript
interface Todo {
  id: string
  description: string
  category: string
  duration: number        // minutes
  fixedTime?: string      // "HH:mm" for fixed appointments
  active: boolean         // included in daily plan
}
```

### Color System (lib/colors.ts)
10-color palette with light/dark variants. Categories get consistent colors via hash-based assignment, overridable in settings.

## Key Libraries
- **@supabase/ssr** - Supabase client for Next.js
- **dnd-kit** - Drag-and-drop reordering
- **Shadcn UI** - Component library (new-york style)
- **next-themes** - Theme switching with hydration handling
- **date-fns** - Time calculations

## Monetization (Lemon Squeezy)

**Status: Wartet auf Store-Verifizierung durch Lemon Squeezy (Stand: 27.12.2024)**

Integration ist vollständig implementiert, aber der Lemon Squeezy Store muss erst verifiziert werden bevor Checkouts funktionieren.

### Was bereits erledigt ist:
- ✅ Datenbank: `subscriptions` Tabelle (Migration 005)
- ✅ Webhook: `app/api/webhooks/lemonsqueezy/route.ts`
- ✅ Hook: `useSupporterStatus()` für Feature-Gating
- ✅ UI: `SupporterBadge`, `UpgradeButton` im Header
- ✅ Environment Variables in Vercel (Production)

### Nach Verifizierung testen:
1. Store-URL aufrufen: https://mini-todo-planner.lemonsqueezy.com
2. In der App auf "Upgrade" klicken
3. Test-Kreditkarte: `4242 4242 4242 4242` (beliebiges Datum/CVC)
4. Nach Kauf sollte Badge erscheinen, Button verschwinden

### Feature-Gating Pattern:
```typescript
import { useSupporterStatus } from '@/hooks/use-supporter-status'

function MyFeature() {
  const { isSupporter } = useSupporterStatus()
  if (!isSupporter) return <UpgradePrompt feature="Dieses Feature" />
  return <ActualFeature />
}
```

### Relevante Dateien:
- `docs/lemon-squeezy-tutorial.md` - Vollständiges Tutorial
- `docs/monetarising.md` - Hintergrund-Recherche
- `lib/lemonsqueezy.ts` - Checkout URL Helper
- `hooks/use-supporter-status.ts` - Supporter-Check Hook

## Notes
- All UI text is in German
- Uses `"use client"` directives for client components
- Theme toggle has hydration-aware mounting to prevent SSR mismatches
