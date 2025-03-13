# Context Query

[한국어 문서(Korean Documentation)](./README.ko.md)

A lightweight, efficient state management library for React applications that provides component tree-scoped state with optimized rendering.

## Why Context Query?

React offers several ways to manage state, but each has limitations in specific scenarios:

1. **Global State (Redux, Zustand)** is designed for app-wide data sharing, not for specific component trees. It's also challenging to handle state based on component lifecycle.

2. **React Context API** creates scoped state within component trees, but causes unnecessary re-renders across all child components when any part of the context changes.

3. **React Query** excels at server state management but uses a global key-based approach, not ideal for component-scoped client state.

Context Query combines the best aspects of these approaches:
- **Component Tree Scoping**: Like Context API, state is tied to component lifecycle
- **Subscription Model**: Like React Query, only components that subscribe to specific state keys re-render
- **Simple API**: Familiar hook-based pattern similar to React's `useState`

## When to Use Context Query

Context Query is ideal for:

- **Component Groups**: When you need to share state among a group of components without prop drilling
- **Component-Scoped State**: When state should be tied to a specific component tree's lifecycle
- **Performance Critical UIs**: When you need to minimize re-renders in complex component hierarchies

It complements (not replaces) other state management tools:
- Use **Global State** for truly app-wide state
- Use **React Query** for server state and data fetching
- Use **Context API** for theme/locale settings that should affect the entire tree
- Use **Context Query** for component-scoped shared state with optimized rendering

## Features

- 🚀 **Granular Re-rendering**: Components only re-render when their specific subscribed state changes
- 🔄 **Component Lifecycle Integration**: State is automatically cleaned up when provider components unmount
- 🔌 **Simple API**: Familiar hook-based API similar to React's `useState`
- 🧩 **TypeScript Support**: Full type safety with TypeScript
- 📦 **Lightweight**: Minimal bundle size with zero dependencies
- 🔧 **Compatible**: Works alongside existing state management solutions

## Installation

```bash
# Using npm
npm install @context-query/react

# Using yarn
yarn add @context-query/react

# Using pnpm
pnpm add @context-query/react
```

## Usage

### 1. Create a Context Query Provider

```tsx
// CounterContextQueryProvider.tsx
import { createContextQuery } from "@context-query/react";

export const {
  Provider: CounterQueryProvider,
  useContextQuery: useCounterQuery,
} = createContextQuery({
  initialState: {
    count1: 0,
    count2: 0,
  },
});
```

### 2. Wrap Your Component Tree with the Provider

```tsx
// ParentComponent.tsx
import { CounterQueryProvider } from "./CounterContextQueryProvider";

function ParentComponent() {
  return (
    <CounterQueryProvider>
      <ChildComponentA />
      <ChildComponentB />
      <ChildComponentC />
    </CounterQueryProvider>
  );
}
```

### 3. Use the State in Your Components

```tsx
// ChildComponentA.tsx
import { useCounterQuery } from "./CounterContextQueryProvider";

function ChildComponentA() {
  const [count, setCount] = useCounterQuery("count1");
  
  const increment = () => {
    setCount(count + 1);
  };

  return (
    <div>
      <h2>Counter from Component A: {count}</h2>
      <button onClick={increment}>+</button>
    </div>
  );
}

// ChildComponentB.tsx
import { useCounterQuery } from "./CounterContextQueryProvider";

function ChildComponentB() {
  const [count, setCount] = useCounterQuery("count1");
  
  // This component will re-render when count1 changes
  // But ChildComponentC won't re-render since it doesn't use count1
  
  return (
    <div>
      <h2>Counter from Component B: {count}</h2>
    </div>
  );
}
```

## Performance Benefits

Unlike regular Context API, Context Query prevents unnecessary re-renders:

- Components only re-render when their subscribed state key changes
- Sibling components that don't use a particular state key won't re-render
- Performance scales better with complex component trees

## Advanced Usage

### Function Updates

Similar to React's `useState`, you can pass a function to the state setter:

```tsx
const [count, setCount] = useCounterQuery("count1");

// Update based on previous state
const increment = () => {
  setCount(prevCount => prevCount + 1);
};
```

### Multiple Providers

You can use multiple providers for different component subtrees:

```tsx
function App() {
  return (
    <div>
      <FeatureAProvider>
        <FeatureAComponents />
      </FeatureAProvider>
      
      <FeatureBProvider>
        <FeatureBComponents />
      </FeatureBProvider>
    </div>
  );
}
```

## Project Structure

The project consists of multiple packages:

- `@context-query/core`: Core functionality and state management
- `@context-query/react`: React bindings and hooks
- `playground`: Demo application showcasing the library

## Development

### Prerequisites

- Node.js >= 18
- pnpm >= 9.0.0

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/context-query.git
cd context-query

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run the playground demo
pnpm dev
```

## License

MIT
