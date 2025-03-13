import React, { createContext, useContext, useState } from 'react';

// 카운터 상태 타입 정의
type CounterState = {
  count1: number;
  count2: number;
  count3: number;
};

// 컨텍스트 타입 정의
type CounterContextType = {
  state: CounterState;
  setState: (key: keyof CounterState, value: number) => void;
};

// 초기 상태
const initialState: CounterState = {
  count1: 0,
  count2: 0,
  count3: 0,
};

// React Context 생성
const CounterContext = createContext<CounterContextType | undefined>(undefined);

// Context Provider 컴포넌트
export function ReactCounterProvider({ children }: { children: React.ReactNode }) {
  const [state, setFullState] = useState<CounterState>(initialState);

  const setState = (key: keyof CounterState, value: number) => {
    setFullState(prevState => ({
      ...prevState,
      [key]: value
    }));
  };

  return (
    <CounterContext.Provider value={{ state, setState }}>
      {children}
    </CounterContext.Provider>
  );
}

// 상태 사용을 위한 커스텀 훅
export function useReactCounterState(key: keyof CounterState): [number, (value: number) => void] {
  const context = useContext(CounterContext);
  
  if (context === undefined) {
    throw new Error('useReactCounterState must be used within a ReactCounterProvider');
  }
  
  const value = context.state[key];
  const setValue = (newValue: number) => context.setState(key, newValue);
  
  return [value, setValue];
}
