import { useEffect } from "react";
import { Button } from "./components/ui/button";
import {
  CounterQueryProvider,
  useCounterQuery,
  useCounterSetter,
} from "./CounterContextQueryProvider";
import { cqLogger } from "./LoggerInstance";

function CQCounter3() {
  const [{ count3 }] = useCounterQuery(["count3"]);
  const setState = useCounterSetter();

  useEffect(() => {
    cqLogger.log(`Counter3 컴포넌트 렌더링 - ${count3}`);
  });

  const increment = () => {
    setState((prev) => ({ ...prev, count3: prev.count3 + 1 }));
  };

  const decrement = () => {
    setState((prev) => ({ ...prev, count3: prev.count3 - 1 }));
  };

  const reset = () => {
    setState((prev) => ({ ...prev, count3: 0 }));
  };

  return (
    <div className="rounded-lg bg-card text-card-foreground shadow-sm mt-4 ml-8">
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">카운터 3</h2>
        <div className="flex items-center justify-between gap-4">
          <span className="text-2xl font-bold text-purple-600">{count3}</span>
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
  const [{ count2 }] = useCounterQuery(["count2"]);
  const setState = useCounterSetter();

  useEffect(() => {
    cqLogger.log(`Counter2 컴포넌트 렌더링 - ${count2}`);
  });

  const increment = () => {
    setState((prev) => ({ 
      ...prev, 
      count2: prev.count2 + 1,
      count3: prev.count3 + 1
    }));
  };

  const decrement = () => {
    setState((prev) => ({ ...prev, count2: prev.count2 - 1 }));
  };

  const reset = () => {
    setState((prev) => ({ ...prev, count2: 0 }));
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-card text-card-foreground shadow-sm mt-4 ml-4">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">카운터 2</h2>
          <div className="flex items-center justify-between gap-4">
            <span className="text-2xl font-bold text-green-600">{count2}</span>
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
  // count1만 구독하여 리렌더링 대상으로 설정
  const [{ count1 }] = useCounterQuery(["count1"]);
  
  // 전체 상태 업데이트용 setter
  const setState = useCounterSetter();

  useEffect(() => {
    cqLogger.log(`Counter1 컴포넌트 렌더링 - ${count1}`);
  });

  const increment = () => {
    // 전체 상태를 한번에 업데이트
    setState((prev) => ({
      count1: prev.count1 + 1,
      count2: prev.count2 + 1,
      count3: prev.count3 + 1
    }));
  };

  const decrement = () => {
    setState((prev) => ({
      count1: prev.count1 - 1,
      count2: prev.count2 - 1,
      count3: prev.count3 - 1
    }));
  };

  const reset = () => {
    setState({
      count1: 0,
      count2: 0,
      count3: 0
    });
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-card text-card-foreground shadow-sm">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">카운터 1</h2>
          <div className="flex items-center justify-between gap-4">
            <span className="text-2xl font-bold text-blue-600">
              {count1}
            </span>
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
  return (
    <div>
      <CounterQueryProvider initialState={{ count1: 0, count2: 0, count3: 0 }}>
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
