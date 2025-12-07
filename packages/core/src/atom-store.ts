import { AtomListener, Subscription } from "./types";

/**
 * 개별 atom의 상태를 관리하는 스토어
 * useSyncExternalStore와 호환되도록 설계됨
 */
export class AtomStore<T> {
  private value: T;
  private listeners: Set<AtomListener>;

  constructor(initialValue: T) {
    this.value = initialValue;
    this.listeners = new Set();
  }

  public getValue(): T {
    return this.value;
  }

  public setValue(newValue: T): void {
    if (Object.is(this.value, newValue)) {
      return;
    }

    this.value = newValue;
    this.notifyListeners();
  }

  /**
   * useSyncExternalStore 호환: 값 없이 리스너 호출
   * React가 getSnapshot()을 통해 값을 직접 조회함
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * useSyncExternalStore의 subscribe 함수와 호환
   * @param listener 상태 변경 시 호출될 콜백 (인자 없음)
   * @returns 구독 해제 함수를 포함한 객체
   */
  public subscribe(listener: AtomListener): Subscription {
    this.listeners.add(listener);

    const unsubscribe = () => {
      this.listeners.delete(listener);
    };

    return {
      unsubscribe,
    };
  }
}