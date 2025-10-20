# Remix + Context Query Example

This example demonstrates how to use `@context-query/react` in a Remix application.

## Features

This example showcases:

- **Counter**: Simple counter with increment/decrement/reset functionality
- **User Profile**: Form handling with user data stored in context
- **Todo List**: Dynamic list management with add/remove operations
- **State Inspector**: Real-time view of all atom states
- **Read-only Components**: Using `useContextAtomValue` for optimized reads
- **Write-only Components**: Using `useContextSetAtom` for updates without re-renders

## Getting Started

### Installation

```bash
pnpm install
```

### Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

Build the application for production:

```bash
pnpm build
```

### Production

Start the production server:

```bash
pnpm start
```

## Project Structure

```
examples/remix/
├── app/
│   ├── routes/
│   │   └── _index.tsx          # Main example page with all components
│   ├── entry.client.tsx         # Client entry point
│   ├── entry.server.tsx         # Server entry point
│   └── root.tsx                 # Root layout
├── public/                      # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Usage

### Basic Setup

```tsx
import { createContextQuery } from "@context-query/react";
import { atom } from "@context-query/core";

// Define atoms
const countAtom = atom(0);
const userAtom = atom({ name: "Guest" });

// Create context query instance
const {
  ContextQueryProvider,
  useContextAtom,
  useContextAtomValue,
  useContextSetAtom,
} = createContextQuery<{
  count: typeof countAtom;
  user: typeof userAtom;
}>();

// Wrap your app with the provider
export default function App() {
  return (
    <ContextQueryProvider
      atoms={{
        count: countAtom,
        user: userAtom,
      }}
    >
      <YourComponents />
    </ContextQueryProvider>
  );
}
```

### Using Hooks

```tsx
// Read and write
const [count, setCount] = useContextAtom("count");

// Read-only (optimized, doesn't re-render on updates)
const count = useContextAtomValue("count");

// Write-only (doesn't re-render on value changes)
const setCount = useContextSetAtom("count");
```

## Key Concepts

### Context Query Provider

The `ContextQueryProvider` wraps your application and provides access to all defined atoms:

```tsx
<ContextQueryProvider
  atoms={{
    count: countAtom,
    user: userAtom,
    todoList: todoListAtom,
  }}
>
  {children}
</ContextQueryProvider>
```

### Atom Hooks

- **`useContextAtom(key)`**: Returns `[value, setValue]` tuple, similar to `useState`
- **`useContextAtomValue(key)`**: Returns only the value (read-only)
- **`useContextSetAtom(key)`**: Returns only the setter function (write-only)
- **`useAllAtomsValue()`**: Returns all atom values as an object
- **`useUpdateAllAtoms()`**: Returns a function to update multiple atoms at once

### Performance Optimization

- Use `useContextAtomValue` when you only need to read values
- Use `useContextSetAtom` when you only need to update values
- This prevents unnecessary re-renders and improves performance

## Learn More

- [Remix Documentation](https://remix.run/docs)
- [Context Query Documentation](../../README.md)
- [React Documentation](https://react.dev)

## License

MIT
