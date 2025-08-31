import { useEffect } from "react";
import { Button } from "./components/ui/button";
import { rcLogger } from "./LoggerInstance";
import {
  ReactCounterProvider,
  useReactCounterState,
  useReactCounterFullState,
} from "./ReactContextProvider";

function RCCounter3() {
  const [tertiaryCounter, setTertiaryCounter] = useReactCounterState("tertiaryCounter");

  useEffect(() => {
    rcLogger.log(`${tertiaryCounter.name} 컴포넌트 렌더링 - ${tertiaryCounter.value}`);
  });

  const increment = () => {
    setTertiaryCounter({ value: tertiaryCounter.value + 1 });
  };

  const decrement = () => {
    setTertiaryCounter({ value: tertiaryCounter.value - 1 });
  };

  const reset = () => {
    setTertiaryCounter({ value: 0 });
  };

  return (
    <div className="rounded-lg bg-card text-card-foreground shadow-sm mt-4 ml-8">
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">{tertiaryCounter.name}</h2>
        <p className="text-sm text-muted-foreground">{tertiaryCounter.description}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-2xl font-bold text-purple-600">{tertiaryCounter.value}</span>
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
  const [secondaryCounter, setSecondaryCounter] = useReactCounterState("secondaryCounter");
  const [, , setFullState] = useReactCounterFullState();

  useEffect(() => {
    rcLogger.log(`${secondaryCounter.name} 컴포넌트 렌더링 - ${secondaryCounter.value}`);
  });

  const increment = () => {
    setFullState((prev) => ({
      ...prev,
      secondaryCounter: { ...prev.secondaryCounter, value: prev.secondaryCounter.value + 1 },
      tertiaryCounter: { ...prev.tertiaryCounter, value: prev.tertiaryCounter.value + 1 }
    }));
  };

  const decrement = () => {
    setSecondaryCounter({ value: secondaryCounter.value - 1 });
  };

  const reset = () => {
    setSecondaryCounter({ value: 0 });
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-card text-card-foreground shadow-sm mt-4 ml-4">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">{secondaryCounter.name}</h2>
          <p className="text-sm text-muted-foreground">{secondaryCounter.description}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-2xl font-bold text-green-600">{secondaryCounter.value}</span>
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
  const [primaryCounter, setPrimaryCounter] = useReactCounterState("primaryCounter");
  const [, , setFullState] = useReactCounterFullState();

  useEffect(() => {
    rcLogger.log(`${primaryCounter.name} 컴포넌트 렌더링 - ${primaryCounter.value}`);
  });

  const increment = () => {
    setFullState((prev) => ({
      primaryCounter: { ...prev.primaryCounter, value: prev.primaryCounter.value + 1 },
      secondaryCounter: { ...prev.secondaryCounter, value: prev.secondaryCounter.value + 1 },
      tertiaryCounter: { ...prev.tertiaryCounter, value: prev.tertiaryCounter.value + 1 }
    }));
  };

  const decrement = () => {
    setFullState((prev) => ({
      primaryCounter: { ...prev.primaryCounter, value: prev.primaryCounter.value - 1 },
      secondaryCounter: { ...prev.secondaryCounter, value: prev.secondaryCounter.value - 1 },
      tertiaryCounter: { ...prev.tertiaryCounter, value: prev.tertiaryCounter.value - 1 }
    }));
  };

  const reset = () => {
    setFullState((prev) => ({
      primaryCounter: { ...prev.primaryCounter, value: 0 },
      secondaryCounter: { ...prev.secondaryCounter, value: 0 },
      tertiaryCounter: { ...prev.tertiaryCounter, value: 0 }
    }));
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-card text-card-foreground shadow-sm">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">{primaryCounter.name}</h2>
          <p className="text-sm text-muted-foreground">{primaryCounter.description}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-2xl font-bold text-blue-600">{primaryCounter.value}</span>
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
