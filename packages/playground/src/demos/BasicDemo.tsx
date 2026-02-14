import { Button } from "../components/ui/button";
import {
  PlaygroundProvider,
  useContextAtom,
  useContextAtomValue,
  useContextSetAtom,
} from "../CounterContextQueryProvider";
import { RenderBadge } from "./RenderBadge";

function CountDisplay() {
  const count = useContextAtomValue("count");

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          useContextAtomValue("count")
        </h4>
        <RenderBadge />
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        count atom만 구독하여 읽기 전용으로 값을 가져옵니다.
      </p>
      <div className="text-4xl font-bold font-mono text-primary">{count}</div>
    </div>
  );
}

function CountController() {
  const [count, setCount] = useContextAtom("count");

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          useContextAtom("count")
        </h4>
        <RenderBadge />
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        읽기 + 쓰기 모두 가능한 훅입니다. 함수형 업데이트를 지원합니다.
      </p>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold font-mono text-foreground w-12 text-center">
          {count}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCount((prev) => prev - 1)}
            className="cursor-pointer"
          >
            -1
          </Button>
          <Button
            size="sm"
            onClick={() => setCount((prev) => prev + 1)}
            className="cursor-pointer"
          >
            +1
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCount((prev) => prev + 10)}
            className="cursor-pointer"
          >
            +10
          </Button>
        </div>
      </div>
    </div>
  );
}

function LabelController() {
  const [label, setLabel] = useContextAtom("label");

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          useContextAtom("label")
        </h4>
        <RenderBadge />
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        label atom만 구독합니다. count가 변경되어도 이 컴포넌트는 리렌더링되지
        않습니다.
      </p>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function StepSetter() {
  const setStep = useContextSetAtom("step");

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          useContextSetAtom("step")
        </h4>
        <RenderBadge />
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        쓰기 전용 훅 - step 값이 변해도 이 컴포넌트는 리렌더링되지 않습니다.
      </p>
      <div className="flex gap-2">
        {[1, 2, 5, 10].map((s) => (
          <Button
            key={s}
            size="sm"
            variant="outline"
            onClick={() => setStep(s)}
            className="cursor-pointer"
          >
            step={s}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function BasicDemo() {
  return (
    <PlaygroundProvider atoms={{ count: 0, step: 1, label: "Counter" }}>
      <div className="space-y-6">
        <div>
          <h3
            className="text-lg font-semibold mb-1"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Basic Atoms
          </h3>
          <p className="text-sm text-muted-foreground">
            <code className="text-primary font-mono text-xs">
              useContextAtom
            </code>
            ,{" "}
            <code className="text-primary font-mono text-xs">
              useContextAtomValue
            </code>
            ,{" "}
            <code className="text-primary font-mono text-xs">
              useContextSetAtom
            </code>{" "}
            훅을 사용한 기본 atom 조작입니다. 각 컴포넌트의 렌더 카운트를
            관찰하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CountDisplay />
          <CountController />
          <LabelController />
          <StepSetter />
        </div>

        <div className="rounded-lg border border-dashed border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground font-mono">
            count를 변경하면 CountDisplay와 CountController만 리렌더링됩니다.
            <br />
            label을 변경하면 LabelController만 리렌더링됩니다.
            <br />
            step을 변경하면 StepSetter는 쓰기 전용이므로 리렌더링되지 않습니다.
          </p>
        </div>
      </div>
    </PlaygroundProvider>
  );
}
