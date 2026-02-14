import "./App.css";
import { useState } from "react";
import { BasicDemo } from "./demos/BasicDemo";
import { DerivedDemo } from "./demos/DerivedDemo";
import { SnapshotDemo } from "./demos/SnapshotDemo";
import { ComparisonDemo } from "./demos/ComparisonDemo";

const tabs = [
  { id: "basic", label: "Basic Atoms", icon: TabIconAtom },
  { id: "derived", label: "Derived & Selectors", icon: TabIconDerived },
  { id: "snapshot", label: "Snapshot & Patch", icon: TabIconSnapshot },
  { id: "comparison", label: "Re-render Comparison", icon: TabIconCompare },
] as const;

type TabId = (typeof tabs)[number]["id"];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>("basic");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary-foreground"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                </svg>
              </div>
              <div>
                <h1
                  className="text-lg font-bold text-foreground leading-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Context Query
                </h1>
                <p className="text-xs text-muted-foreground">
                  Interactive Playground
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground bg-secondary rounded-full px-2.5 py-1">
                v0.5.1
              </span>
              <a
                href="https://github.com/load28/context-query"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                aria-label="GitHub"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-none -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <Icon active={activeTab === tab.id} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "basic" && <BasicDemo />}
        {activeTab === "derived" && <DerivedDemo />}
        {activeTab === "snapshot" && <SnapshotDemo />}
        {activeTab === "comparison" && <ComparisonDemo />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-muted-foreground">
            <code className="font-mono">@context-query/react</code> &mdash;
            Component tree-scoped state management with granular re-rendering
          </p>
        </div>
      </footer>
    </div>
  );
}

// --- Tab Icons (SVG) ---
function TabIconAtom({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? "text-primary" : "text-muted-foreground"}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2a10 10 0 0 1 0 20" />
      <path d="M12 2a10 10 0 0 0 0 20" />
    </svg>
  );
}

function TabIconDerived({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? "text-primary" : "text-muted-foreground"}
    >
      <path d="M4 6h16M4 12h16M4 18h8" />
      <path d="M16 18l4-4-4-4" />
    </svg>
  );
}

function TabIconSnapshot({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? "text-primary" : "text-muted-foreground"}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 3v18" />
    </svg>
  );
}

function TabIconCompare({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? "text-primary" : "text-muted-foreground"}
    >
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

export default App;
