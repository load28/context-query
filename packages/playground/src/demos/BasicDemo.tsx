import { Button } from "../components/ui/button";
import {
  PlaygroundProvider,
  useContextAtom,
  useContextAtomValue,
  useContextAtomSelector,
  useSnapshotValue,
  usePatch,
  useResetAtom,
} from "../CounterContextQueryProvider";

function CountControl() {
  const [count, setCount] = useContextAtom("count");
  return (
    <div className="flex items-center justify-between">
      <code className="text-xs text-muted-foreground">count</code>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold font-mono">{count}</span>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => setCount((p) => p - 1)} className="cursor-pointer h-7 w-7 text-xs p-0">-</Button>
          <Button size="sm" onClick={() => setCount((p) => p + 1)} className="cursor-pointer h-7 w-7 text-xs p-0">+</Button>
        </div>
      </div>
    </div>
  );
}

function StepControl() {
  const [step, setStep] = useContextAtom("step");
  return (
    <div className="flex items-center justify-between">
      <code className="text-xs text-muted-foreground">step</code>
      <div className="flex gap-1">
        {[1, 2, 5].map((s) => (
          <Button key={s} size="sm" variant={step === s ? "default" : "outline"} onClick={() => setStep(s)} className="cursor-pointer h-7 w-7 text-xs p-0">{s}</Button>
        ))}
      </div>
    </div>
  );
}

function DerivedRow() {
  const doubleCount = useContextAtomValue("doubleCount");
  const total = useContextAtomValue("total");
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <code className="text-xs text-accent">doubleCount</code>
          <span className="text-[10px] text-muted-foreground font-mono">count*2</span>
        </div>
        <span className="text-lg font-bold font-mono text-accent">{doubleCount}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <code className="text-xs text-accent">total</code>
          <span className="text-[10px] text-muted-foreground font-mono">count*step</span>
        </div>
        <span className="text-lg font-bold font-mono text-accent">{total}</span>
      </div>
    </>
  );
}

function SelectorRow() {
  const isPositive = useContextAtomSelector("count", (c) => c > 0);
  return (
    <div className="flex items-center justify-between">
      <code className="text-xs text-muted-foreground">selector <span className="font-mono">count&gt;0</span></code>
      <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${isPositive ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"}`}>
        {isPositive ? "true" : "false"}
      </span>
    </div>
  );
}

function Actions() {
  const patch = usePatch();
  const resetCount = useResetAtom("count");
  const resetStep = useResetAtom("step");
  return (
    <div className="flex items-center justify-between">
      <code className="text-xs text-muted-foreground">actions</code>
      <div className="flex gap-1.5">
        <Button size="sm" onClick={() => patch({ count: 100, step: 5 })} className="cursor-pointer h-7 text-xs">Patch</Button>
        <Button size="sm" variant="outline" onClick={() => { resetCount(); resetStep(); }} className="cursor-pointer h-7 text-xs">Reset</Button>
      </div>
    </div>
  );
}

function Snapshot() {
  const snapshot = useSnapshotValue();
  return (
    <pre className="text-[10px] font-mono bg-background/50 rounded-md px-3 py-2 text-muted-foreground leading-relaxed">
      {JSON.stringify(snapshot, null, 2)}
    </pre>
  );
}

export function BasicDemo() {
  return (
    <PlaygroundProvider atoms={{ count: 0, step: 1, label: "Counter" }}>
      <div className="max-w-md mx-auto">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          {/* Atoms */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Atoms</h4>
            <CountControl />
            <StepControl />
          </div>

          <div className="border-t border-border" />

          {/* Derived */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-accent/70">Derived</h4>
            <DerivedRow />
          </div>

          <div className="border-t border-border" />

          {/* Selector + Actions */}
          <div className="space-y-2.5">
            <SelectorRow />
            <Actions />
          </div>

          <div className="border-t border-border" />

          {/* Snapshot */}
          <Snapshot />
        </div>
      </div>
    </PlaygroundProvider>
  );
}
