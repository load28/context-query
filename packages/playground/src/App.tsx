import "./App.css";
import { Button } from "./components/ui/button";
import {
  CounterQueryProvider,
  useCounterQuery,
} from "./CounterContextQueryProvider";
import {
  ReactCounterProvider,
  useReactCounterState,
} from "./ReactContextProvider";

function CQCounter3() {
  const [state, setState] = useCounterQuery("count3");
  console.log(
    "%c[CQ] Counter3 렌더링",
    "background: #4285f4; color: white; padding: 2px 6px; border-radius: 2px;"
  );

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

function CQCounter2({ children }: { children: React.ReactNode }) {
  const [state, setState] = useCounterQuery("count2");
  console.log(
    "%c[CQ] Counter2 렌더링",
    "background: #4285f4; color: white; padding: 2px 6px; border-radius: 2px;"
  );

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

function CQCounter1({ children }: { children: React.ReactNode }) {
  const [state, setState] = useCounterQuery("count1");
  console.log(
    "%c[CQ] Counter1 렌더링",
    "background: #4285f4; color: white; padding: 2px 6px; border-radius: 2px;"
  );

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

function RCCounter3() {
  const [state, setState] = useReactCounterState("count3");
  console.log(
    "%c[RC] Counter3 렌더링",
    "background: #34a853; color: white; padding: 2px 6px; border-radius: 2px;"
  );

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

function RCCounter2({ children }: { children: React.ReactNode }) {
  const [state, setState] = useReactCounterState("count2");
  console.log(
    "%c[RC] Counter2 렌더링",
    "background: #34a853; color: white; padding: 2px 6px; border-radius: 2px;"
  );

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

function RCCounter1({ children }: { children: React.ReactNode }) {
  const [state, setState] = useReactCounterState("count1");
  console.log(
    "%c[RC] Counter1 렌더링",
    "background: #34a853; color: white; padding: 2px 6px; border-radius: 2px;"
  );

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

function App() {
  console.group("렌더링 시작");
  console.log(
    "%c[정보] Context API 비교 플레이그라운드 렌더링",
    "color: #333; font-weight: bold;"
  );
  console.log(
    "%c[CQ] Context Query 로그는 파란색 배경으로 표시됩니다.",
    "background: #4285f4; color: white; padding: 2px 6px; border-radius: 2px;"
  );
  console.log(
    "%c[RC] React Context 로그는 녹색 배경으로 표시됩니다.",
    "background: #34a853; color: white; padding: 2px 6px; border-radius: 2px;"
  );
  console.groupEnd();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Context API 비교 플레이그라운드
          </h1>
          <p className="text-muted-foreground">
            Context Query vs React Context API 비교
          </p>
          <div className="flex justify-center space-x-4 mt-4">
            <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-lg">
              <div className="size-3 bg-[#4285f4] rounded-full mr-2"></div>
              <span>Context Query</span>
            </div>
            <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-lg">
              <div className="size-3 bg-[#34a853] rounded-full mr-2"></div>
              <span>React Context</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CounterQueryProvider>
            <div className="rounded-lg bg-card text-card-foreground shadow-sm p-4">
              <h2 className="text-xl font-bold mb-2">Context Query 버전</h2>
              <p className="text-muted-foreground mb-4">
                <code>@context-query/react</code> 라이브러리를 사용한
                구현입니다.
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
        </div>
      </div>
    </div>
  );
}

export default App;
