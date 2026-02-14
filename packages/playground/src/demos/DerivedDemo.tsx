import { Button } from "../components/ui/button";
import {
  PlaygroundProvider,
  useContextAtom,
  useContextAtomValue,
  useContextAtomSelector,
  useAtomError,
} from "../CounterContextQueryProvider";
import { RenderBadge } from "./RenderBadge";

function CountControl() {
  const [count, setCount] = useContextAtom("count");

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          count (Writable Atom)
        </h4>
        <RenderBadge />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold font-mono text-foreground">
          {count}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCount((p) => p - 1)}
            className="cursor-pointer"
          >
            -1
          </Button>
          <Button
            size="sm"
            onClick={() => setCount((p) => p + 1)}
            className="cursor-pointer"
          >
            +1
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepControl() {
  const [step, setStep] = useContextAtom("step");

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          step (Writable Atom)
        </h4>
        <RenderBadge />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold font-mono text-foreground">
          {step}
        </span>
        <div className="flex gap-2">
          {[1, 2, 3, 5].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={step === s ? "default" : "outline"}
              onClick={() => setStep(s)}
              className="cursor-pointer"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DoubleCountDisplay() {
  const doubleCount = useContextAtomValue("doubleCount");

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-accent">
          doubleCount (Derived)
        </h4>
        <RenderBadge />
      </div>
      <p className="text-xs text-muted-foreground mb-2 font-mono">
        derived((get) =&gt; get("count") * 2)
      </p>
      <div className="text-3xl font-bold font-mono text-accent">
        {doubleCount}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        count가 변경될 때만 자동으로 재계산됩니다.
      </p>
    </div>
  );
}

function TotalDisplay() {
  const total = useContextAtomValue("total");

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-accent">total (Derived)</h4>
        <RenderBadge />
      </div>
      <p className="text-xs text-muted-foreground mb-2 font-mono">
        derived((get) =&gt; get("count") * get("step"))
      </p>
      <div className="text-3xl font-bold font-mono text-accent">{total}</div>
      <p className="text-xs text-muted-foreground mt-1">
        count 또는 step 어느 것이든 변경되면 재계산됩니다.
      </p>
    </div>
  );
}

function SelectorDisplay() {
  const isPositive = useContextAtomSelector(
    "count",
    (count) => count > 0
  );

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          useContextAtomSelector
        </h4>
        <RenderBadge />
      </div>
      <p className="text-xs text-muted-foreground mb-2 font-mono">
        selector: (count) =&gt; count &gt; 0
      </p>
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            isPositive
              ? "bg-accent/20 text-accent"
              : "bg-destructive/20 text-destructive"
          }`}
        >
          {isPositive ? "Positive" : "Zero or Negative"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        boolean 결과가 변경될 때만 리렌더링됩니다. count가 1→2로 변해도
        리렌더링되지 않습니다.
      </p>
    </div>
  );
}

function ErrorDisplay() {
  const error = useAtomError("doubleCount");

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          useAtomError
        </h4>
        <RenderBadge />
      </div>
      <p className="text-xs text-muted-foreground mb-2 font-mono">
        useAtomError("doubleCount")
      </p>
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            error
              ? "bg-destructive/20 text-destructive"
              : "bg-accent/20 text-accent"
          }`}
        >
          {error ? `Error: ${error.message}` : "No Error"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        derived atom의 에러 상태를 구독합니다.
      </p>
    </div>
  );
}

export function DerivedDemo() {
  return (
    <PlaygroundProvider atoms={{ count: 0, step: 1, label: "Counter" }}>
      <div className="space-y-6">
        <div>
          <h3
            className="text-lg font-semibold mb-1"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Derived Atoms & Selectors
          </h3>
          <p className="text-sm text-muted-foreground">
            <code className="text-accent font-mono text-xs">derived()</code>로
            다른 atom에서 값을 계산하고,{" "}
            <code className="text-primary font-mono text-xs">
              useContextAtomSelector
            </code>
            로 부분적인 상태 변화만 구독합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CountControl />
          <StepControl />
        </div>

        <div className="relative">
          <div className="absolute -top-3 left-4 bg-background px-2">
            <span className="text-xs font-medium text-accent uppercase tracking-wider">
              Derived Atoms
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-accent/20 rounded-lg p-4 pt-5">
            <DoubleCountDisplay />
            <TotalDisplay />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-3 left-4 bg-background px-2">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              Advanced Hooks
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-primary/20 rounded-lg p-4 pt-5">
            <SelectorDisplay />
            <ErrorDisplay />
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-border bg-card/50 p-4">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Dependency Graph
          </h4>
          <div className="font-mono text-xs text-muted-foreground space-y-1">
            <p>
              <span className="text-foreground">doubleCount</span> ← count
            </p>
            <p>
              <span className="text-foreground">total</span> ← count, step
            </p>
          </div>
        </div>
      </div>
    </PlaygroundProvider>
  );
}
