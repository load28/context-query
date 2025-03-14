import { useEffect, useMemo, useState } from "react";
import { Button } from "./components/ui/button";
import {
  CounterQueryProvider,
  useCounterQuery,
} from "./CounterContextQueryProvider";
import { cqLogger } from "./LoggerInstance";

function CQCounter3() {
  const [state, setState] = useCounterQuery("count3");

  useEffect(() => {
    cqLogger.log(`Counter3 컴포넌트 렌더링 - ${state}`);
  });

  const increment = () => {
    setState((prev) => prev + 1);
  };

  const decrement = () => {
    setState((prev) => prev - 1);
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

function CQCounter2() {
  const [state, setState] = useCounterQuery("count2");

  useEffect(() => {
    cqLogger.log(`Counter2 컴포넌트 렌더링 - ${state}`);
  });

  const increment = () => {
    setState((prev) => prev + 1);
  };

  const decrement = () => {
    setState((prev) => prev - 1);
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
    </div>
  );
}

const CQCounter1 = () => {
  const [state, setState] = useCounterQuery("count1");

  useEffect(() => {
    cqLogger.log(`Counter1 컴포넌트 렌더링 - ${state}`);
  });

  const increment = () => {
    setState((prev) => prev + 1);
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
    </div>
  );
};

export function ContextQueryImplementation() {
  const [counts, setCounts] = useState({ count1: 0, count2: 0, count3: 0 });

  const initialState = useMemo(() => counts, [counts]);

  const incrementCount1 = () => {
    setCounts((prevCounts) => ({
      ...prevCounts,
      count1: prevCounts.count1 + 1,
    }));
  };

  const incrementCount2 = () => {
    setCounts((prevCounts) => ({
      ...prevCounts,
      count2: prevCounts.count2 + 1,
    }));
  };

  const incrementCount3 = () => {
    setCounts((prevCounts) => ({
      ...prevCounts,
      count3: prevCounts.count3 + 1,
    }));
  };

  return (
    <div>
      <div className="flex justify-center space-x-4 mt-4 mb-4">
        <Button onClick={incrementCount1}>count1 증가</Button>
        <Button onClick={incrementCount2}>count2 증가</Button>
        <Button onClick={incrementCount3}>count3 증가</Button>
      </div>

      <CounterQueryProvider initialState={initialState}>
        <div className="rounded-lg bg-card text-card-foreground shadow-sm p-4">
          <h2 className="text-xl font-bold mb-2">Context Query 버전</h2>
          <p className="text-muted-foreground mb-4">
            <code>@context-query/react</code> 라이브러리를 사용한 구현입니다.
          </p>

          <div className="space-y-6">
            <CQCounter1 />
            <CQCounter2 />
            <CQCounter3 />
          </div>
        </div>
      </CounterQueryProvider>
    </div>
  );
}
