"use client";

import { ContextQueryStore } from "@context-query/core";
import { useEffect, useState } from "react";

// Define the shape of our atoms
interface MyAtoms {
  count: number;
  user: { name: string; email: string };
  theme: "light" | "dark";
}

// Create a store instance
const store = new ContextQueryStore<MyAtoms>({
  count: 0,
  user: { name: "John Doe", email: "john@example.com" },
  theme: "light",
});

export default function Home() {
  const [count, setCount] = useState(store.getAtomValue("count"));
  const [user, setUser] = useState(store.getAtomValue("user"));
  const [theme, setTheme] = useState(store.getAtomValue("theme"));
  const [allValues, setAllValues] = useState(store.getAllAtomValues());

  useEffect(() => {
    // Subscribe to count changes
    const countSubscription = store.subscribeToAtom("count", (key, value) => {
      console.log(`${String(key)} changed to:`, value);
      setCount(value);
      setAllValues(store.getAllAtomValues());
    });

    // Subscribe to user changes
    const userSubscription = store.subscribeToAtom("user", (key, value) => {
      console.log(`${String(key)} changed to:`, value);
      setUser(value);
      setAllValues(store.getAllAtomValues());
    });

    // Subscribe to theme changes
    const themeSubscription = store.subscribeToAtom("theme", (key, value) => {
      console.log(`${String(key)} changed to:`, value);
      setTheme(value);
      setAllValues(store.getAllAtomValues());
    });

    // Cleanup subscriptions on unmount
    return () => {
      countSubscription.unsubscribe();
      userSubscription.unsubscribe();
      themeSubscription.unsubscribe();
    };
  }, []);

  const incrementCount = () => {
    store.setAtomValue("count", count + 1);
  };

  const updateUser = () => {
    store.setAtomValue("user", {
      name: "Jane Smith",
      email: "jane@example.com",
    });
  };

  const toggleTheme = () => {
    store.setAtomValue("theme", theme === "light" ? "dark" : "light");
  };

  const updateMultiple = () => {
    store.updateAllAtoms({
      count: count + 10,
      theme: theme === "light" ? "dark" : "light",
    });
  };

  return (
    <main>
      <h1>Context Query - Next.js Example</h1>

      <div className="example-section">
        <h2>1. Basic Atom Usage</h2>
        <p>Simple counter example using atom state management:</p>
        <pre>
          <code>{`const store = new ContextQueryStore<MyAtoms>({
  count: 0,
  user: { name: "John Doe", email: "john@example.com" },
  theme: "light",
});

// Get value
const count = store.getAtomValue("count");

// Set value
store.setAtomValue("count", count + 1);`}</code>
        </pre>
        <div className="result">
          <strong>Current Count:</strong> {count}
          <br />
          <button
            onClick={incrementCount}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              background: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Increment Count
          </button>
        </div>
      </div>

      <div className="example-section">
        <h2>2. Complex Object State</h2>
        <p>Managing complex objects with type safety:</p>
        <pre>
          <code>{`interface MyAtoms {
  user: { name: string; email: string };
}

// Update user object
store.setAtomValue("user", {
  name: "Jane Smith",
  email: "jane@example.com"
});`}</code>
        </pre>
        <div className="result">
          <strong>Current User:</strong>
          <br />
          Name: {user.name}
          <br />
          Email: {user.email}
          <br />
          <button
            onClick={updateUser}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              background: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Update User
          </button>
        </div>
      </div>

      <div className="example-section">
        <h2>3. Theme Toggle Example</h2>
        <p>Switch between different states:</p>
        <pre>
          <code>{`type Theme = "light" | "dark";

// Toggle theme
store.setAtomValue("theme",
  theme === "light" ? "dark" : "light"
);`}</code>
        </pre>
        <div className="result">
          <strong>Current Theme:</strong> {theme}
          <br />
          <button
            onClick={toggleTheme}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              background: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Toggle Theme
          </button>
        </div>
      </div>

      <div className="example-section">
        <h2>4. Subscription Pattern</h2>
        <p>React to state changes with subscriptions:</p>
        <pre>
          <code>{`useEffect(() => {
  // Subscribe to changes
  const subscription = store.subscribeToAtom(
    "count",
    (key, value) => {
      console.log(\`\${String(key)} changed to:\`, value);
      setCount(value);
    }
  );

  // Cleanup
  return () => subscription.unsubscribe();
}, []);`}</code>
        </pre>
        <div className="result">
          <strong>Info:</strong> All changes are logged to the console. Open
          DevTools to see subscription callbacks in action.
        </div>
      </div>

      <div className="example-section">
        <h2>5. Batch Updates</h2>
        <p>Update multiple atoms at once:</p>
        <pre>
          <code>{`// Update multiple atoms
store.updateAllAtoms({
  count: count + 10,
  theme: theme === "light" ? "dark" : "light"
});`}</code>
        </pre>
        <div className="result">
          <button
            onClick={updateMultiple}
            style={{
              padding: "0.5rem 1rem",
              cursor: "pointer",
              background: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Update Multiple Atoms (+10 count & toggle theme)
          </button>
        </div>
      </div>

      <div className="example-section">
        <h2>6. Get All Values</h2>
        <p>Retrieve all atom values at once:</p>
        <pre>
          <code>{`const allValues = store.getAllAtomValues();
// Returns: { count, user, theme }`}</code>
        </pre>
        <div className="result">
          <strong>All Current Values:</strong>
          <pre style={{ background: "white", padding: "1rem", marginTop: "0.5rem" }}>
            {JSON.stringify(allValues, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
}
