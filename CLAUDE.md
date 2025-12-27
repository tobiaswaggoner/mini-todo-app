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

## Architecture

### State Management
All data persists in browser localStorage via the `useLocalStorage<T>` hook. No backend/database.

**localStorage keys:**
- `mini-todos-backlog` - Todo items array
- `mini-todos-view` - Current view ("backlog" | "planner")
- `mini-todos-startTime` - Day start time (HH:mm)
- `mini-todos-availableHours` - Available planning hours
- `mini-todos-categoryColors` - Category-to-color mappings

### Component Hierarchy
```
app/layout.tsx (ThemeProvider wrapper)
  └── app/page.tsx
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
- **dnd-kit** - Drag-and-drop reordering
- **Shadcn UI** - Component library (new-york style)
- **next-themes** - Theme switching with hydration handling
- **date-fns** - Time calculations

## Notes
- All UI text is in German
- Uses `"use client"` directives for client components
- Theme toggle has hydration-aware mounting to prevent SSR mismatches
