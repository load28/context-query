import React, { ReactNode, useMemo, useState } from "react";
import { Button } from "./components/ui/button";
import {
  CounterQueryProvider,
  useCounterQuery,
} from "./CounterContextQueryProvider";
import { createLogger } from "./lib/logger";

const cqLogger = createLogger("Context Query");

function CQCounter3() {
  const [state, setState] = useCounterQuery("count3");

  cqLogger.log(`Counter3 컴포넌트 렌더링 - ${state}`);

  const increment = () => {
    setState(state + 1);
  };

  const decrement = () => {
    setState(state - 1);
  };

  const reset = () => {
    setState(0);
  };

  return (
    <div className="rounded-lg bg-card text-card-foreground shadow-sm mt-4 ml-8">
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">카운터 3</h2>
        <div className="flex items-center justify-between gap-4">
          <span className="text-2xl font-bold text-purple-600">{state}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={decrement}>
              감소
            </Button>
            <Button size="sm" onClick={increment}>
              증가
            </Button>
            <Button size="sm" variant="secondary" onClick={reset}>
              초기화
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CQCounter2({ children }: { children: ReactNode }) {
  const [state, setState] = useCounterQuery("count2");

  cqLogger.log(`Counter2 컴포넌트 렌더링 - ${state}`);

  const increment = () => {
    setState(state + 1);
  };

  const decrement = () => {
    setState(state - 1);
  };

  const reset = () => {
    setState(0);
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-card text-card-foreground shadow-sm mt-4 ml-4">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">카운터 2</h2>
          <div className="flex items-center justify-between gap-4">
            <span className="text-2xl font-bold text-green-600">{state}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={decrement}>
                감소
              </Button>
              <Button size="sm" onClick={increment}>
                증가
              </Button>
              <Button size="sm" variant="secondary" onClick={reset}>
                초기화
              </Button>
            </div>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}

const CQCounter1 = React.memo(({ children }: { children: ReactNode }) => {
  const [state, setState] = useCounterQuery("count1");

  cqLogger.log(`Counter1 컴포넌트 렌더링 - ${state}`);

  const increment = () => {
    setState(state + 1);
  };

  const decrement = () => {
    setState(state - 1);
  };

  const reset = () => {
    setState(0);
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-card text-card-foreground shadow-sm">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">카운터 1</h2>
          <div className="flex items-center justify-between gap-4">
            <span className="text-2xl font-bold text-blue-600">{state}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={decrement}>
                감소
              </Button>
              <Button size="sm" onClick={increment}>
                증가
              </Button>
              <Button size="sm" variant="secondary" onClick={reset}>
                초기화
              </Button>
            </div>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
});

export function ContextQueryImplementation() {
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [count3, setCount3] = useState(0);

  const initialState = useMemo(
    () => ({
      count1,
      count2,
      count3,
    }),
    [count1, count2, count3]
  );

  return (
    <div>
      <div className="flex justify-center space-x-4 mt-4 mb-4">
        <Button onClick={() => setCount1(count1 + 1)}>count1 증가</Button>
        <Button onClick={() => setCount2(count2 + 1)}>count2 증가</Button>
        <Button onClick={() => setCount3(count3 + 1)}>count3 증가</Button>
      </div>

      <CounterQueryProvider initialState={initialState}>
        <div className="rounded-lg bg-card text-card-foreground shadow-sm p-4">
          <h2 className="text-xl font-bold mb-2">Context Query 버전</h2>
          <p className="text-muted-foreground mb-4">
            <code>@context-query/react</code> 라이브러리를 사용한 구현입니다.
          </p>

          <div className="space-y-6">
            <CQCounter1>
              <CQCounter2>
                <CQCounter3 />
              </CQCounter2>
            </CQCounter1>
          </div>
        </div>
      </CounterQueryProvider>
    </div>
  );
}

export { cqLogger };
