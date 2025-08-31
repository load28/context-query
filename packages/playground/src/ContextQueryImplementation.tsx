import { useEffect } from "react";
import { Button } from "./components/ui/button";
import {
  CounterQueryProvider,
  useCounterAtom,
  useCounterSetAtom,
} from "./CounterContextQueryProvider";
import { cqLogger } from "./LoggerInstance";

function CQCounter3() {
  const [tertiaryCounter, setTertiaryCounter] =
    useCounterAtom("tertiaryCounter");

  useEffect(() => {
    cqLogger.log(
      `${tertiaryCounter.name} 컴포넌트 렌더링 - ${tertiaryCounter.value}`
    );
  });

  const increment = () => {
    setTertiaryCounter((prev) => ({ ...prev, value: prev.value + 1 }));
  };

  const decrement = () => {
    setTertiaryCounter((prev) => ({ ...prev, value: prev.value - 1 }));
  };

  const reset = () => {
    setTertiaryCounter((prev) => ({ ...prev, value: 0 }));
  };

  return (
    <div className="rounded-lg bg-card text-card-foreground shadow-sm mt-4 ml-8">
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">{tertiaryCounter.name}</h2>
        <p className="text-sm text-muted-foreground">
          {tertiaryCounter.description}
        </p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-2xl font-bold text-purple-600">
            {tertiaryCounter.value}
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
  );
}

function CQCounter2() {
  const [secondaryCounter, setSecondaryCounter] =
    useCounterAtom("secondaryCounter");
  const setTertiaryCounter = useCounterSetAtom("tertiaryCounter");

  useEffect(() => {
    cqLogger.log(
      `${secondaryCounter.name} 컴포넌트 렌더링 - ${secondaryCounter.value}`
    );
  });

  const increment = () => {
    setSecondaryCounter((prev) => ({ ...prev, value: prev.value + 1 }));
    setTertiaryCounter((prev) => ({ ...prev, value: prev.value + 1 }));
  };

  const decrement = () => {
    setSecondaryCounter((prev) => ({ ...prev, value: prev.value - 1 }));
  };

  const reset = () => {
    setSecondaryCounter((prev) => ({ ...prev, value: 0 }));
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-card text-card-foreground shadow-sm mt-4 ml-4">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">{secondaryCounter.name}</h2>
          <p className="text-sm text-muted-foreground">
            {secondaryCounter.description}
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-2xl font-bold text-green-600">
              {secondaryCounter.value}
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
}

const CQCounter1 = () => {
  const [primaryCounter, setPrimaryCounter] = useCounterAtom("primaryCounter");

  const setSecondaryCounter = useCounterSetAtom("secondaryCounter");
  const setTertiaryCounter = useCounterSetAtom("tertiaryCounter");

  useEffect(() => {
    cqLogger.log(
      `${primaryCounter.name} 컴포넌트 렌더링 - ${primaryCounter.value}`
    );
  });

  const increment = () => {
    setPrimaryCounter((prev) => ({ ...prev, value: prev.value + 1 }));
    setSecondaryCounter((prev) => ({ ...prev, value: prev.value + 1 }));
    setTertiaryCounter((prev) => ({ ...prev, value: prev.value + 1 }));
  };

  const decrement = () => {
    setPrimaryCounter((prev) => ({ ...prev, value: prev.value - 1 }));
    setSecondaryCounter((prev) => ({ ...prev, value: prev.value - 1 }));
    setTertiaryCounter((prev) => ({ ...prev, value: prev.value - 1 }));
  };

  const reset = () => {
    setPrimaryCounter((prev) => ({ ...prev, value: 0 }));
    setSecondaryCounter((prev) => ({ ...prev, value: 0 }));
    setTertiaryCounter((prev) => ({ ...prev, value: 0 }));
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-card text-card-foreground shadow-sm">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">{primaryCounter.name}</h2>
          <p className="text-sm text-muted-foreground">
            {primaryCounter.description}
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-2xl font-bold text-blue-600">
              {primaryCounter.value}
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
      <CounterQueryProvider
        atoms={{
          primaryCounter: {
            name: "메인 카운터",
            value: 0,
            description: "모든 카운터를 제어하는 메인 카운터입니다",
            dependencies: ["secondaryCounter", "tertiaryCounter"],
          },
          secondaryCounter: {
            name: "보조 카운터",
            value: 0,
            description:
              "메인 카운터와 연동되며 서드 카운터도 함께 증가시킵니다",
          },
          tertiaryCounter: {
            name: "서드 카운터",
            value: 0,
            description: "독립적으로 동작하는 카운터입니다",
          },
        }}
      >
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
