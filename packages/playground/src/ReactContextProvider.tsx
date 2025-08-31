import React, { createContext, useContext, useState } from 'react';

// 카운터 상태 타입 정의
type CounterData = {
  name: string;
  value: number;
  description: string;
};

type CounterState = {
  primaryCounter: CounterData;
  secondaryCounter: CounterData;
  tertiaryCounter: CounterData;
};

// 컨텍스트 타입 정의
type CounterContextType = {
  state: CounterState;
  setCounter: (key: keyof CounterState, updates: Partial<CounterData>) => void;
  setMultipleCounters: (updates: Partial<CounterState>) => void;
  setFullState: (updater: (prevState: CounterState) => CounterState) => void;
};

// 초기 상태
const initialState: CounterState = {
  primaryCounter: {
    name: "메인 카운터",
    value: 0,
    description: "모든 카운터를 제어하는 메인 카운터입니다"
  },
  secondaryCounter: {
    name: "보조 카운터",
    value: 0,
    description: "메인 카운터와 연동되며 서드 카운터도 함께 증가시킵니다"
  },
  tertiaryCounter: {
    name: "서드 카운터",
    value: 0,
    description: "독립적으로 동작하는 카운터입니다"
  },
};

// React Context 생성
const CounterContext = createContext<CounterContextType | undefined>(undefined);

// Context Provider 컴포넌트
export function ReactCounterProvider({ children }: { children: React.ReactNode }) {
  const [state, setFullState] = useState<CounterState>(initialState);

  const setCounter = (key: keyof CounterState, updates: Partial<CounterData>) => {
    setFullState(prevState => ({
      ...prevState,
      [key]: {
        ...prevState[key],
        ...updates
      }
    }));
  };

  const setMultipleCounters = (updates: Partial<CounterState>) => {
    setFullState(prevState => {
      const newState = { ...prevState };
      Object.entries(updates).forEach(([key, value]) => {
        if (value && key in newState) {
          newState[key as keyof CounterState] = {
            ...newState[key as keyof CounterState],
            ...value
          };
        }
      });
      return newState;
    });
  };

  const setStateWithUpdater = (updater: (prevState: CounterState) => CounterState) => {
    setFullState(updater);
  };

  return (
    <CounterContext.Provider value={{ 
      state, 
      setCounter, 
      setMultipleCounters, 
      setFullState: setStateWithUpdater 
    }}>
      {children}
    </CounterContext.Provider>
  );
}

// 상태 사용을 위한 커스텀 훅
export function useReactCounterState(key: keyof CounterState): [CounterData, (updates: Partial<CounterData>) => void] {
  const context = useContext(CounterContext);
  
  if (context === undefined) {
    throw new Error('useReactCounterState must be used within a ReactCounterProvider');
  }
  
  const counterData = context.state[key];
  const setCounterData = (updates: Partial<CounterData>) => context.setCounter(key, updates);
  
  return [counterData, setCounterData];
}

// 전체 상태 접근을 위한 커스텀 훅
export function useReactCounterFullState(): [
  CounterState,
  (updates: Partial<CounterState>) => void,
  (updater: (prevState: CounterState) => CounterState) => void
] {
  const context = useContext(CounterContext);
  
  if (context === undefined) {
    throw new Error('useReactCounterFullState must be used within a ReactCounterProvider');
  }
  
  return [context.state, context.setMultipleCounters, context.setFullState];
}
