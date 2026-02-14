import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "../components/ui/button";
import {
  SimpleProvider,
  useSimpleAtom,
  useSimpleSetAtom,
} from "../CounterContextQueryProvider";
import { createLogger, useLogs } from "../lib/logger";

const cqLog = createLogger("cq-comparison");
const rcLog = createLogger("rc-comparison");

// --- React Context side ---
type RCState = { counterA: number; counterB: number; counterC: number };
const RCContext = createContext<{
  state: RCState;
  setState: React.Dispatch<React.SetStateAction<RCState>>;
} | null>(null);

function RCProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RCState>({
    counterA: 0,
    counterB: 0,
    counterC: 0,
  });
  return (
    <RCContext.Provider value={{ state, setState }}>
      {children}
    </RCContext.Provider>
  );
}

function useRC() {
  const ctx = useContext(RCContext);
  if (!ctx) throw new Error("Missing RCProvider");
  return ctx;
}

// --- React Context components ---
function RCCounterA() {
  const { state, setState } = useRC();
  const renderCount = useRef(0);
  renderCount.current++;

  useEffect(() => {
    rcLog.log(`Counter A rendered (#${renderCount.current})`);
  });

  return (
    <div className="flex items-center justify-between rounded-md bg-background/50 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">A</span>
        <span className="font-mono text-lg font-bold">{state.counterA}</span>
        <span className="text-xs text-muted-foreground font-mono">
          #{renderCount.current}
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          setState((p) => ({ ...p, counterA: p.counterA + 1 }))
        }
        className="cursor-pointer h-7 text-xs"
      >
        +1
      </Button>
    </div>
  );
}

function RCCounterB() {
  const { state, setState } = useRC();
  const renderCount = useRef(0);
  renderCount.current++;

  useEffect(() => {
    rcLog.log(`Counter B rendered (#${renderCount.current})`);
  });

  return (
    <div className="flex items-center justify-between rounded-md bg-background/50 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">B</span>
        <span className="font-mono text-lg font-bold">{state.counterB}</span>
        <span className="text-xs text-muted-foreground font-mono">
          #{renderCount.current}
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          setState((p) => ({ ...p, counterB: p.counterB + 1 }))
        }
        className="cursor-pointer h-7 text-xs"
      >
        +1
      </Button>
    </div>
  );
}

function RCCounterC() {
  const { state, setState } = useRC();
  const renderCount = useRef(0);
  renderCount.current++;

  useEffect(() => {
    rcLog.log(`Counter C rendered (#${renderCount.current})`);
  });

  return (
    <div className="flex items-center justify-between rounded-md bg-background/50 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">C</span>
        <span className="font-mono text-lg font-bold">{state.counterC}</span>
        <span className="text-xs text-muted-foreground font-mono">
          #{renderCount.current}
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          setState((p) => ({ ...p, counterC: p.counterC + 1 }))
        }
        className="cursor-pointer h-7 text-xs"
      >
        +1
      </Button>
    </div>
  );
}

// --- Context Query components ---
function CQCounterA() {
  const [val, setVal] = useSimpleAtom("counterA");
  const renderCount = useRef(0);
  renderCount.current++;

  useEffect(() => {
    cqLog.log(`Counter A rendered (#${renderCount.current})`);
  });

  return (
    <div className="flex items-center justify-between rounded-md bg-background/50 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">A</span>
        <span className="font-mono text-lg font-bold">{val}</span>
        <span className="text-xs text-muted-foreground font-mono">
          #{renderCount.current}
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setVal((p) => p + 1)}
        className="cursor-pointer h-7 text-xs"
      >
        +1
      </Button>
    </div>
  );
}

function CQCounterB() {
  const [val, setVal] = useSimpleAtom("counterB");
  const renderCount = useRef(0);
  renderCount.current++;

  useEffect(() => {
    cqLog.log(`Counter B rendered (#${renderCount.current})`);
  });

  return (
    <div className="flex items-center justify-between rounded-md bg-background/50 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">B</span>
        <span className="font-mono text-lg font-bold">{val}</span>
        <span className="text-xs text-muted-foreground font-mono">
          #{renderCount.current}
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setVal((p) => p + 1)}
        className="cursor-pointer h-7 text-xs"
      >
        +1
      </Button>
    </div>
  );
}

function CQCounterC() {
  const [val, setVal] = useSimpleAtom("counterC");
  const renderCount = useRef(0);
  renderCount.current++;

  useEffect(() => {
    cqLog.log(`Counter C rendered (#${renderCount.current})`);
  });

  return (
    <div className="flex items-center justify-between rounded-md bg-background/50 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">C</span>
        <span className="font-mono text-lg font-bold">{val}</span>
        <span className="text-xs text-muted-foreground font-mono">
          #{renderCount.current}
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setVal((p) => p + 1)}
        className="cursor-pointer h-7 text-xs"
      >
        +1
      </Button>
    </div>
  );
}

// --- Log viewer ---
function MiniLogViewer({
  logger,
  maxLogs = 10,
}: {
  logger: ReturnType<typeof createLogger>;
  maxLogs?: number;
}) {
  const logs = useLogs(logger, maxLogs);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      ref={ref}
      className="max-h-40 overflow-y-auto rounded-md bg-background/50 p-2 font-mono text-xs"
    >
      {logs.length === 0 ? (
        <span className="text-muted-foreground italic">
          No renders logged yet
        </span>
      ) : (
        logs.map((log, i) => (
          <div key={i} className="py-0.5 text-muted-foreground">
            {log}
          </div>
        ))
      )}
    </div>
  );
}

export function ComparisonDemo() {
  return (
    <div className="space-y-6">
      <div>
        <h3
          className="text-lg font-semibold mb-1"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Re-render Comparison
        </h3>
        <p className="text-sm text-muted-foreground">
          Counter A만 변경할 때, React Context는 B, C도 리렌더링하지만 Context
          Query는 A만 리렌더링합니다. 각 컴포넌트의{" "}
          <code className="text-primary font-mono text-xs">#렌더 횟수</code>를
          비교하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Context Query Side */}
        <SimpleProvider
          atoms={{ counterA: 0, counterB: 0, counterC: 0 }}
        >
          <div className="rounded-lg border border-primary/30 bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <h4
                className="font-semibold text-primary"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Context Query
              </h4>
              <span className="text-xs text-accent bg-accent/10 rounded-full px-2 py-0.5">
                Granular
              </span>
            </div>
            <div className="space-y-2 mb-4">
              <CQCounterA />
              <CQCounterB />
              <CQCounterC />
            </div>
            <MiniLogViewer logger={cqLog} />
          </div>
        </SimpleProvider>

        {/* React Context Side */}
        <RCProvider>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-[#61DAFB]" />
              <h4
                className="font-semibold text-[#61DAFB]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                React Context
              </h4>
              <span className="text-xs text-destructive bg-destructive/10 rounded-full px-2 py-0.5">
                Full Re-render
              </span>
            </div>
            <div className="space-y-2 mb-4">
              <RCCounterA />
              <RCCounterB />
              <RCCounterC />
            </div>
            <MiniLogViewer logger={rcLog} />
          </div>
        </RCProvider>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-card/50 p-4">
        <p className="text-xs text-muted-foreground font-mono">
          Context Query: Counter A의 +1 클릭 시 → A만 리렌더링 (B, C는
          그대로)
          <br />
          React Context: Counter A의 +1 클릭 시 → A, B, C 모두 리렌더링
        </p>
      </div>
    </div>
  );
}
