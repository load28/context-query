import React, { createContext, useContext, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { SimpleProvider, useSimpleAtom } from "../CounterContextQueryProvider";

// --- React Context side ---
type RCState = { counterA: number; counterB: number; counterC: number };
const RCContext = createContext<{ state: RCState; setState: React.Dispatch<React.SetStateAction<RCState>> } | null>(null);

function RCProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RCState>({ counterA: 0, counterB: 0, counterC: 0 });
  return <RCContext.Provider value={{ state, setState }}>{children}</RCContext.Provider>;
}

function useRC() {
  const ctx = useContext(RCContext);
  if (!ctx) throw new Error("Missing RCProvider");
  return ctx;
}

function RCCounter({ name }: { name: "counterA" | "counterB" | "counterC" }) {
  const { state, setState } = useRC();
  const renderCount = useRef(0);
  renderCount.current++;
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium w-4">{name.slice(-1)}</span>
        <span className="font-mono text-base font-bold">{state[name]}</span>
        <span className="text-[10px] text-muted-foreground font-mono">#{renderCount.current}</span>
      </div>
      <Button size="sm" variant="outline" onClick={() => setState((p) => ({ ...p, [name]: p[name] + 1 }))} className="cursor-pointer h-6 text-xs px-2">+1</Button>
    </div>
  );
}

// --- Context Query side ---
function CQCounter({ name }: { name: "counterA" | "counterB" | "counterC" }) {
  const [val, setVal] = useSimpleAtom(name);
  const renderCount = useRef(0);
  renderCount.current++;
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium w-4">{name.slice(-1)}</span>
        <span className="font-mono text-base font-bold">{val}</span>
        <span className="text-[10px] text-muted-foreground font-mono">#{renderCount.current}</span>
      </div>
      <Button size="sm" variant="outline" onClick={() => setVal((p) => p + 1)} className="cursor-pointer h-6 text-xs px-2">+1</Button>
    </div>
  );
}

export function ComparisonDemo() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
      {/* Context Query */}
      <SimpleProvider atoms={{ counterA: 0, counterB: 0, counterC: 0 }}>
        <div className="rounded-xl border border-primary/30 bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm font-semibold text-primary" style={{ fontFamily: "var(--font-heading)" }}>Context Query</span>
            <span className="text-[10px] text-accent bg-accent/10 rounded-full px-1.5 py-0.5">Granular</span>
          </div>
          <CQCounter name="counterA" />
          <CQCounter name="counterB" />
          <CQCounter name="counterC" />
        </div>
      </SimpleProvider>

      {/* React Context */}
      <RCProvider>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#61DAFB]" />
            <span className="text-sm font-semibold text-[#61DAFB]" style={{ fontFamily: "var(--font-heading)" }}>React Context</span>
            <span className="text-[10px] text-destructive bg-destructive/10 rounded-full px-1.5 py-0.5">Full</span>
          </div>
          <RCCounter name="counterA" />
          <RCCounter name="counterB" />
          <RCCounter name="counterC" />
        </div>
      </RCProvider>

      <p className="sm:col-span-2 text-center text-xs text-muted-foreground">
        A를 클릭하면 — CQ: A만 리렌더 / React Context: A,B,C 모두 리렌더 (<code className="font-mono text-primary">#</code> 비교)
      </p>
    </div>
  );
}
