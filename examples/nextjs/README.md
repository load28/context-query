# Context Query - Next.js Example

This example demonstrates how to use `@context-query/core` in a Next.js application with the App Router.

## Features Demonstrated

- Basic atom state management
- Complex object state handling
- Subscription pattern for reactive updates
- Batch updates with multiple atoms
- Type-safe state management with TypeScript

## Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm (recommended) or npm

### Installation

1. Install dependencies from the root of the monorepo:

```bash
pnpm install
```

2. Navigate to the example directory:

```bash
cd examples/nextjs
```

### Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the example application.

### Build

Build the application for production:

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

## Project Structure

```
examples/nextjs/
├── src/
│   └── app/
│       ├── layout.tsx      # Root layout with metadata
│       ├── page.tsx        # Main page with examples
│       └── globals.css     # Global styles
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md              # This file
```

## Key Concepts

### Creating a Store

```typescript
import { ContextQueryStore } from "@context-query/core";

interface MyAtoms {
  count: number;
  user: { name: string; email: string };
  theme: "light" | "dark";
}

const store = new ContextQueryStore<MyAtoms>({
  count: 0,
  user: { name: "John Doe", email: "john@example.com" },
  theme: "light",
});
```

### Reading and Writing Values

```typescript
// Get a value
const count = store.getAtomValue("count");

// Set a value
store.setAtomValue("count", count + 1);

// Get all values
const allValues = store.getAllAtomValues();
```

### Subscribing to Changes

```typescript
useEffect(() => {
  const subscription = store.subscribeToAtom("count", (key, value) => {
    console.log(`${String(key)} changed to:`, value);
    setCount(value);
  });

  return () => subscription.unsubscribe();
}, []);
```

### Batch Updates

```typescript
store.updateAllAtoms({
  count: count + 10,
  theme: theme === "light" ? "dark" : "light",
});
```

## Examples Included

1. **Basic Atom Usage** - Simple counter with increment functionality
2. **Complex Object State** - Managing user objects with multiple properties
3. **Theme Toggle** - Switching between light/dark themes
4. **Subscription Pattern** - Reactive updates using subscriptions
5. **Batch Updates** - Updating multiple atoms simultaneously
6. **Get All Values** - Retrieving the entire state at once

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Context Query Core](../../packages/core/README.md)

## Notes

- This example uses Next.js 15 with the App Router
- The `"use client"` directive is required for components using hooks
- All state changes are logged to the browser console for debugging
- TypeScript provides full type safety for all store operations
