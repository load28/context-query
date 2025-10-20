import type { MetaFunction } from "@remix-run/node";
import { createContextQuery } from "@context-query/react";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Remix + Context Query Example" },
    { name: "description", content: "Example app using @context-query/react with Remix" },
  ];
};

// Define atom types
type AppAtoms = {
  count: number;
  user: { name: string; email: string };
  todoList: string[];
};

// Create context query instance
const {
  ContextQueryProvider,
  useContextAtom,
  useContextAtomValue,
  useContextSetAtom,
  useAllAtomsValue,
} = createContextQuery<AppAtoms>();

// Counter component
function Counter() {
  const [count, setCount] = useContextAtom("count");

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Counter Example</h2>
      <div style={styles.counterDisplay}>Count: {count}</div>
      <div style={styles.buttonGroup}>
        <button onClick={() => setCount(count + 1)} style={styles.button}>
          Increment
        </button>
        <button onClick={() => setCount(count - 1)} style={styles.button}>
          Decrement
        </button>
        <button onClick={() => setCount(0)} style={styles.buttonSecondary}>
          Reset
        </button>
      </div>
    </div>
  );
}

// User form component
function UserForm() {
  const [user, setUser] = useContextAtom("user");

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>User Profile</h2>
      <div style={styles.formGroup}>
        <label style={styles.label}>Name:</label>
        <input
          type="text"
          value={user.name}
          onChange={(e) => setUser({ ...user, name: e.target.value })}
          style={styles.input}
          placeholder="Enter your name"
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Email:</label>
        <input
          type="email"
          value={user.email}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
          style={styles.input}
          placeholder="Enter your email"
        />
      </div>
      <div style={styles.userInfo}>
        <p><strong>Current User:</strong> {user.name || "Not set"}</p>
        <p><strong>Email:</strong> {user.email || "Not set"}</p>
      </div>
    </div>
  );
}

// Todo list component
function TodoList() {
  const [todos, setTodos] = useContextAtom("todoList");
  const [inputValue, setInputValue] = useState("");

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([...todos, inputValue.trim()]);
      setInputValue("");
    }
  };

  const removeTodo = (index: number) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Todo List</h2>
      <div style={styles.todoInput}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addTodo()}
          style={styles.input}
          placeholder="Add a new todo..."
        />
        <button onClick={addTodo} style={styles.button}>
          Add
        </button>
      </div>
      <ul style={styles.todoList}>
        {todos.length === 0 ? (
          <li style={styles.emptyMessage}>No todos yet. Add one above!</li>
        ) : (
          todos.map((todo, index) => (
            <li key={index} style={styles.todoItem}>
              <span>{todo}</span>
              <button
                onClick={() => removeTodo(index)}
                style={styles.deleteButton}
              >
                Delete
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

// State inspector component
function StateInspector() {
  const allValues = useAllAtomsValue();

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>State Inspector</h2>
      <pre style={styles.codeBlock}>
        {JSON.stringify(allValues, null, 2)}
      </pre>
    </div>
  );
}

// Read-only components using useContextAtomValue
function CountDisplay() {
  const count = useContextAtomValue("count");
  return (
    <div style={styles.infoBox}>
      <strong>Current Count (read-only):</strong> {count}
    </div>
  );
}

// Write-only component using useContextSetAtom
function QuickActions() {
  const setCount = useContextSetAtom("count");
  const setUser = useContextSetAtom("user");
  const setTodos = useContextSetAtom("todoList");

  const resetAll = () => {
    setCount(0);
    setUser({ name: "Guest", email: "" });
    setTodos([]);
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Quick Actions</h2>
      <button onClick={resetAll} style={styles.buttonDanger}>
        Reset All State
      </button>
    </div>
  );
}

export default function Index() {
  return (
    <ContextQueryProvider
      atoms={{
        count: 0,
        user: { name: "Guest", email: "" },
        todoList: [],
      }}
    >
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>Remix + Context Query</h1>
          <p style={styles.subtitle}>
            A powerful example of @context-query/react in a Remix application
          </p>
        </header>

        <div style={styles.grid}>
          <Counter />
          <UserForm />
          <TodoList />
          <StateInspector />
        </div>

        <div style={styles.bottomSection}>
          <CountDisplay />
          <QuickActions />
        </div>

        <footer style={styles.footer}>
          <p>Built with Remix and @context-query/react</p>
        </footer>
      </div>
    </ContextQueryProvider>
  );
}

// Styles
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    padding: "2rem",
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    textAlign: "center" as const,
    marginBottom: "3rem",
  },
  title: {
    fontSize: "3rem",
    fontWeight: 800,
    color: "#1a1a1a",
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "1.25rem",
    color: "#666",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  cardTitle: {
    fontSize: "1.5rem",
    fontWeight: 600,
    marginBottom: "1rem",
    color: "#1a1a1a",
  },
  counterDisplay: {
    fontSize: "2rem",
    fontWeight: 700,
    textAlign: "center" as const,
    margin: "1.5rem 0",
    color: "#4a5568",
  },
  buttonGroup: {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "center",
  },
  button: {
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    color: "white",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  buttonSecondary: {
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    color: "white",
    backgroundColor: "#6b7280",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  buttonDanger: {
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    color: "white",
    backgroundColor: "#ef4444",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    width: "100%",
  },
  formGroup: {
    marginBottom: "1rem",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: 600,
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    fontSize: "1rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    boxSizing: "border-box" as const,
  },
  userInfo: {
    marginTop: "1.5rem",
    padding: "1rem",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
  },
  todoInput: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  todoList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  todoItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem",
    marginBottom: "0.5rem",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
  },
  deleteButton: {
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "white",
    backgroundColor: "#ef4444",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  emptyMessage: {
    textAlign: "center" as const,
    color: "#9ca3af",
    padding: "2rem",
  },
  codeBlock: {
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    padding: "1rem",
    borderRadius: "8px",
    overflow: "auto",
    fontSize: "0.875rem",
    maxHeight: "300px",
  },
  bottomSection: {
    marginBottom: "2rem",
  },
  infoBox: {
    backgroundColor: "white",
    padding: "1rem",
    borderRadius: "12px",
    marginBottom: "1rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textAlign: "center" as const,
  },
  footer: {
    textAlign: "center" as const,
    marginTop: "3rem",
    color: "#6b7280",
  },
};
