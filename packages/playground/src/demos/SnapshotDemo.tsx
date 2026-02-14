import { Button } from "../components/ui/button";
import {
  PlaygroundProvider,
  useContextAtom,
  useSnapshot,
  useSnapshotValue,
  usePatch,
  useResetAtom,
} from "../CounterContextQueryProvider";
import { RenderBadge } from "./RenderBadge";

function CountEditor() {
  const [count, setCount] = useContextAtom("count");

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">count</h4>
        <RenderBadge />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold font-mono">{count}</span>
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

function StepEditor() {
  const [step, setStep] = useContextAtom("step");

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">step</h4>
        <RenderBadge />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold font-mono">{step}</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setStep((p) => p - 1)}
            className="cursor-pointer"
          >
            -1
          </Button>
          <Button
            size="sm"
            onClick={() => setStep((p) => p + 1)}
            className="cursor-pointer"
          >
            +1
          </Button>
        </div>
      </div>
    </div>
  );
}

function SnapshotViewer() {
  const snapshot = useSnapshotValue();

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          useSnapshotValue()
        </h4>
        <RenderBadge />
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        모든 atom의 현재 상태를 읽기 전용으로 가져옵니다.
      </p>
      <pre className="text-xs font-mono bg-background rounded-md p-3 overflow-auto text-foreground">
        {JSON.stringify(snapshot, null, 2)}
      </pre>
    </div>
  );
}

function BatchUpdater() {
  const patch = usePatch();

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          usePatch()
        </h4>
        <RenderBadge />
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        쓰기 전용 훅 - atom 변경 시 이 컴포넌트는 리렌더링되지 않습니다. 여러
        atom을 한 번에 업데이트합니다.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => patch({ count: 100, step: 10 })}
          className="cursor-pointer"
        >
          count=100, step=10
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => patch({ count: 0, step: 1, label: "Counter" })}
          className="cursor-pointer"
        >
          Reset All
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => patch({ label: "Updated!" })}
          className="cursor-pointer"
        >
          label="Updated!"
        </Button>
      </div>
    </div>
  );
}

function SnapshotReadWrite() {
  const [snapshot, patchFn] = useSnapshot();

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          useSnapshot()
        </h4>
        <RenderBadge />
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        읽기 + 쓰기 모두 가능합니다. 현재 snapshot 기반으로 batch 업데이트를
        수행합니다.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            patchFn({
              count: snapshot.count + 5,
              step: snapshot.step + 1,
            })
          }
          className="cursor-pointer"
        >
          count+5, step+1
        </Button>
        <span className="text-xs text-muted-foreground self-center font-mono">
          count={snapshot.count}, step={snapshot.step}
        </span>
      </div>
    </div>
  );
}

function ResetButtons() {
  const resetCount = useResetAtom("count");
  const resetStep = useResetAtom("step");
  const resetLabel = useResetAtom("label");

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          useResetAtom()
        </h4>
        <RenderBadge />
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        개별 atom을 초기값으로 리셋합니다.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={resetCount}
          className="cursor-pointer"
        >
          Reset count
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={resetStep}
          className="cursor-pointer"
        >
          Reset step
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={resetLabel}
          className="cursor-pointer"
        >
          Reset label
        </Button>
      </div>
    </div>
  );
}

export function SnapshotDemo() {
  return (
    <PlaygroundProvider atoms={{ count: 0, step: 1, label: "Counter" }}>
      <div className="space-y-6">
        <div>
          <h3
            className="text-lg font-semibold mb-1"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Snapshot, Patch & Reset
          </h3>
          <p className="text-sm text-muted-foreground">
            <code className="text-primary font-mono text-xs">useSnapshot</code>,{" "}
            <code className="text-primary font-mono text-xs">usePatch</code>,{" "}
            <code className="text-primary font-mono text-xs">useResetAtom</code>{" "}
            훅으로 전체 상태 조회, 일괄 업데이트, 개별 리셋을 수행합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CountEditor />
          <StepEditor />
        </div>

        <SnapshotViewer />

        <div className="relative">
          <div className="absolute -top-3 left-4 bg-background px-2">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              Bulk Operations
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 border border-primary/20 rounded-lg p-4 pt-5">
            <BatchUpdater />
            <SnapshotReadWrite />
            <ResetButtons />
          </div>
        </div>
      </div>
    </PlaygroundProvider>
  );
}
