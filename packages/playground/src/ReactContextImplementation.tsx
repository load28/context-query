import { ReactNode } from "react";
import { Button } from "./components/ui/button";
import { createLogger } from "./lib/logger";
import {
  ReactCounterProvider,
  useReactCounterState,
} from "./ReactContextProvider";

const rcLogger = createLogger("React Context");

function RCCounter3() {
  const [state, setState] = useReactCounterState("count3");

  rcLogger.log(`Counter3 컴포넌트 렌더링 - ${state}`);

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

function RCCounter2({ children }: { children: ReactNode }) {
  const [state, setState] = useReactCounterState("count2");

  rcLogger.log(`Counter2 컴포넌트 렌더링 - ${state}`);

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

function RCCounter1({ children }: { children: ReactNode }) {
  const [state, setState] = useReactCounterState("count1");

  rcLogger.log(`Counter1 컴포넌트 렌더링 - ${state}`);

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
          <RCCounter1>
            <RCCounter2>
              <RCCounter3 />
            </RCCounter2>
          </RCCounter1>
        </div>
      </div>
    </ReactCounterProvider>
  );
}

export { rcLogger };
