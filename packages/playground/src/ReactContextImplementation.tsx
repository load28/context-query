import { useEffect } from "react";
import { Button } from "./components/ui/button";
import { rcLogger } from "./LoggerInstance";
import {
  ReactCounterProvider,
  useReactCounterState,
  useReactCounterFullState,
} from "./ReactContextProvider";

function RCCounter3() {
  const [state, setState] = useReactCounterState("count3");

  useEffect(() => {
    rcLogger.log(`Counter3 컴포넌트 렌더링 - ${state}`);
  });

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

function RCCounter2() {
  const [state, setState] = useReactCounterState("count2");
  const [, , setFullState] = useReactCounterFullState();

  useEffect(() => {
    rcLogger.log(`Counter2 컴포넌트 렌더링 - ${state}`);
  });

  const increment = () => {
    setFullState((prev) => ({
      ...prev,
      count2: prev.count2 + 1,
      count3: prev.count3 + 1
    }));
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
    </div>
  );
}

function RCCounter1() {
  const [state, setState] = useReactCounterState("count1");
  const [, , setFullState] = useReactCounterFullState();

  useEffect(() => {
    rcLogger.log(`Counter1 컴포넌트 렌더링 - ${state}`);
  });

  const increment = () => {
    setFullState((prev) => ({
      count1: prev.count1 + 1,
      count2: prev.count2 + 1,
      count3: prev.count3 + 1
    }));
  };

  const decrement = () => {
    setFullState((prev) => ({
      count1: prev.count1 - 1,
      count2: prev.count2 - 1,
      count3: prev.count3 - 1
    }));
  };

  const reset = () => {
    setFullState(() => ({
      count1: 0,
      count2: 0,
      count3: 0
    }));
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
}

export function ReactContextImplementation() {
  return (
    <ReactCounterProvider>
      <div className="rounded-lg bg-card text-card-foreground shadow-sm p-4">
        <h2 className="text-xl font-bold mb-2">React Context 버전</h2>
        <p className="text-muted-foreground mb-4">
          기본 React Context API를 사용한 구현입니다.
        </p>

        <div className="space-y-6">
          <RCCounter1 />
          <RCCounter2 />
          <RCCounter3 />
        </div>
      </div>
    </ReactCounterProvider>
  );
}
