/**
 * Runtime Verification Tests
 *
 * 실제 사용 시나리오를 시뮬레이션하여 시그널 엔진 + 스토어가
 * 올바르게 동작하는지 종합 검증합니다.
 */
import { describe, it, expect, vi } from "vitest";
import { ContextQueryStore } from "../contextQueryStore";
import { derived } from "../derived";
import { atom } from "../atom";
import { shallowEqual } from "../shallowEqual";
import { createReactiveSystem } from "../signal/system";

describe("Runtime Verification - 실제 사용 시나리오", () => {
  // ────────────────────────────────────────────
  // 시나리오 1: 쇼핑 카트 (Shopping Cart)
  // ────────────────────────────────────────────
  describe("시나리오 1: 쇼핑 카트", () => {
    it("상품 추가/삭제 시 총액이 자동 계산된다", () => {
      const store = new ContextQueryStore({
        items: atom(
          [
            { name: "노트북", price: 1200000, qty: 1 },
            { name: "마우스", price: 35000, qty: 2 },
          ] as Array<{ name: string; price: number; qty: number }>,
          { equalityFn: shallowEqual }
        ),
        discount: 0.1, // 10% 할인
        totalPrice: derived((get) => {
          const items = get("items") as Array<{ price: number; qty: number }>;
          return items.reduce((sum, item) => sum + item.price * item.qty, 0);
        }),
        finalPrice: derived((get) => {
          const total = get("totalPrice") as number;
          const discount = get("discount") as number;
          return Math.round(total * (1 - discount));
        }),
      });

      // 초기값 검증
      expect(store.getAtomValue("totalPrice")).toBe(1270000);
      expect(store.getAtomValue("finalPrice")).toBe(1143000);

      // 상품 수량 변경
      store.setAtomValue("items", [
        { name: "노트북", price: 1200000, qty: 2 },
        { name: "마우스", price: 35000, qty: 2 },
      ]);
      expect(store.getAtomValue("totalPrice")).toBe(2470000);
      expect(store.getAtomValue("finalPrice")).toBe(2223000);

      // 할인율 변경
      store.setAtomValue("discount", 0.2);
      expect(store.getAtomValue("finalPrice")).toBe(1976000);

      // 스냅샷 일관성
      const snap = store.getSnapshot();
      expect(snap.totalPrice).toBe(2470000);
      expect(snap.finalPrice).toBe(1976000);
    });

    it("구독자에게 변경 알림이 정확히 전달된다", () => {
      const store = new ContextQueryStore({
        price: 1000,
        tax: derived((get) => Math.round((get("price") as number) * 0.1)),
      });

      const priceListener = vi.fn();
      const taxListener = vi.fn();
      store.subscribeToAtom("price", priceListener);
      store.subscribeToAtom("tax", taxListener);

      store.setAtomValue("price", 2000);
      expect(priceListener).toHaveBeenCalledTimes(1);
      expect(taxListener).toHaveBeenCalledTimes(1);
      expect(store.getAtomValue("tax")).toBe(200);

      // 같은 값 설정 → 알림 없음
      store.setAtomValue("price", 2000);
      expect(priceListener).toHaveBeenCalledTimes(1); // 변화 없음
    });
  });

  // ────────────────────────────────────────────
  // 시나리오 2: 폼 유효성 검사 (Form Validation)
  // ────────────────────────────────────────────
  describe("시나리오 2: 폼 유효성 검사", () => {
    it("필드 변경 시 유효성이 자동 검사된다", () => {
      const store = new ContextQueryStore({
        username: "",
        email: "",
        password: "",
        usernameError: derived((get) => {
          const val = get("username") as string;
          if (val.length === 0) return "필수 항목입니다";
          if (val.length < 3) return "3자 이상 입력하세요";
          return null;
        }),
        emailError: derived((get) => {
          const val = get("email") as string;
          if (val.length === 0) return "필수 항목입니다";
          if (!val.includes("@")) return "올바른 이메일을 입력하세요";
          return null;
        }),
        passwordError: derived((get) => {
          const val = get("password") as string;
          if (val.length === 0) return "필수 항목입니다";
          if (val.length < 8) return "8자 이상 입력하세요";
          return null;
        }),
        isValid: derived((get) => {
          return (
            get("usernameError") === null &&
            get("emailError") === null &&
            get("passwordError") === null
          );
        }),
      });

      // 초기: 모든 필드 비어있음 → 유효하지 않음
      expect(store.getAtomValue("isValid")).toBe(false);
      expect(store.getAtomValue("usernameError")).toBe("필수 항목입니다");

      // 하나씩 채워가기
      store.setAtomValue("username", "ab");
      expect(store.getAtomValue("usernameError")).toBe("3자 이상 입력하세요");
      expect(store.getAtomValue("isValid")).toBe(false);

      store.setAtomValue("username", "alice");
      expect(store.getAtomValue("usernameError")).toBeNull();

      store.setAtomValue("email", "alice@test.com");
      store.setAtomValue("password", "12345678");
      expect(store.getAtomValue("isValid")).toBe(true);

      // 이메일 잘못 입력 → 다시 무효
      store.setAtomValue("email", "invalid");
      expect(store.getAtomValue("isValid")).toBe(false);
      expect(store.getAtomValue("emailError")).toBe("올바른 이메일을 입력하세요");
    });
  });

  // ────────────────────────────────────────────
  // 시나리오 3: 다중 스토어 격리 (Multi-store Isolation)
  // ────────────────────────────────────────────
  describe("시나리오 3: 다중 스토어 격리", () => {
    it("여러 스토어가 서로 간섭하지 않는다", () => {
      const userStore = new ContextQueryStore({
        name: "Alice",
        role: "admin",
        displayName: derived((get) => `${get("name")} (${get("role")})`),
      });

      const settingsStore = new ContextQueryStore({
        theme: "dark",
        language: "ko",
        label: derived((get) => `${get("theme")}-${get("language")}`),
      });

      // 각 스토어 독립 동작
      expect(userStore.getAtomValue("displayName")).toBe("Alice (admin)");
      expect(settingsStore.getAtomValue("label")).toBe("dark-ko");

      // userStore 변경이 settingsStore에 영향 없음
      const settingsListener = vi.fn();
      settingsStore.subscribeToAtom("label", settingsListener);

      userStore.setAtomValue("name", "Bob");
      expect(userStore.getAtomValue("displayName")).toBe("Bob (admin)");
      expect(settingsListener).not.toHaveBeenCalled();

      // settingsStore 변경이 userStore에 영향 없음
      settingsStore.setAtomValue("theme", "light");
      expect(settingsStore.getAtomValue("label")).toBe("light-ko");
      expect(userStore.getAtomValue("displayName")).toBe("Bob (admin)");
    });
  });

  // ────────────────────────────────────────────
  // 시나리오 4: 에러 복구 (Error Recovery)
  // ────────────────────────────────────────────
  describe("시나리오 4: 에러 복구", () => {
    it("에러 발생 후 정상값으로 복구된다", () => {
      const errors: Error[] = [];
      const store = new ContextQueryStore(
        {
          data: '{"count": 42}',
          parsed: derived((get) => {
            const raw = get("data") as string;
            return JSON.parse(raw);
          }),
        },
        {
          onError: (err) => errors.push(err),
        }
      );

      // 정상 동작
      expect(store.getAtomValue("parsed")).toEqual({ count: 42 });
      expect(store.getAtomError("parsed")).toBeNull();

      // 잘못된 JSON → 에러
      store.setAtomValue("data", "not-json{{{");
      expect(() => store.getAtomValue("parsed")).toThrow();
      expect(store.getAtomError("parsed")).not.toBeNull();
      expect(errors.length).toBe(1);

      // 다시 정상 JSON → 복구
      store.setAtomValue("data", '{"count": 100}');
      expect(store.getAtomValue("parsed")).toEqual({ count: 100 });
      expect(store.getAtomError("parsed")).toBeNull();
    });
  });

  // ────────────────────────────────────────────
  // 시나리오 5: Diamond Problem (시그널 엔진 직접 사용)
  // ────────────────────────────────────────────
  describe("시나리오 5: 시그널 엔진 Diamond Problem", () => {
    it("A→B,C→D 패턴에서 D는 A 변경 시 정확히 1번만 계산된다", () => {
      const system = createReactiveSystem();
      let dComputeCount = 0;

      const A = system.signal(1);
      const B = system.computed(() => A.get() * 2);
      const C = system.computed(() => A.get() * 3);
      const D = system.computed(() => {
        dComputeCount++;
        return B.get() + C.get();
      });

      // 초기 계산
      expect(D.get()).toBe(5); // 2 + 3
      expect(dComputeCount).toBe(1);

      // A 변경 → D는 1번만 재계산
      dComputeCount = 0;
      A.set(10);
      expect(D.get()).toBe(50); // 20 + 30
      expect(dComputeCount).toBe(1);

      // 1000번 반복해도 매번 1번만 계산
      dComputeCount = 0;
      for (let i = 0; i < 1000; i++) {
        A.set(i);
        D.get();
      }
      expect(dComputeCount).toBe(1000); // 정확히 1000번
    });

    it("effect가 diamond 패턴에서 일관된 값을 읽는다", () => {
      const system = createReactiveSystem();
      const results: number[] = [];

      const A = system.signal(1);
      const B = system.computed(() => A.get() * 2);
      const C = system.computed(() => A.get() * 3);

      system.effect(() => {
        results.push(B.get() + C.get());
      });

      // 초기: B=2, C=3, sum=5
      expect(results).toEqual([5]);

      // A=2 → B=4, C=6, sum=10 (8이 아님!)
      A.set(2);
      expect(results).toEqual([5, 10]);

      // A=5 → B=10, C=15, sum=25
      A.set(5);
      expect(results).toEqual([5, 10, 25]);
    });
  });

  // ────────────────────────────────────────────
  // 시나리오 6: Batch 처리
  // ────────────────────────────────────────────
  describe("시나리오 6: Batch 처리", () => {
    it("batch 내에서 여러 signal 변경 시 effect는 1번만 실행된다", () => {
      const system = createReactiveSystem();
      const log: string[] = [];

      const firstName = system.signal("John");
      const lastName = system.signal("Doe");

      system.effect(() => {
        log.push(`${firstName.get()} ${lastName.get()}`);
      });

      expect(log).toEqual(["John Doe"]);

      // batch 없이 → effect 2번 실행
      firstName.set("Jane");
      lastName.set("Smith");
      // Jane Doe (firstName 변경 시), Jane Smith (lastName 변경 시)
      expect(log).toEqual(["John Doe", "Jane Doe", "Jane Smith"]);

      // batch로 → effect 1번만 실행
      log.length = 0;
      system.batch(() => {
        firstName.set("Bob");
        lastName.set("Lee");
      });
      expect(log).toEqual(["Bob Lee"]); // 중간값 없이 최종 결과만
    });
  });

  // ────────────────────────────────────────────
  // 시나리오 7: Deep Chain (깊은 의존성 체인)
  // ────────────────────────────────────────────
  describe("시나리오 7: Deep Chain 스택 오버플로우 없음", () => {
    it("100단계 깊이의 computed 체인이 정상 동작한다", () => {
      const system = createReactiveSystem();
      const source = system.signal(0);
      let current: { get(): number } = source;

      // 100단계 체인: source → c1 → c2 → ... → c100
      for (let i = 0; i < 100; i++) {
        const prev = current;
        current = system.computed(() => prev.get() + 1);
      }

      expect(current.get()).toBe(100); // 0 + 100

      source.set(50);
      expect(current.get()).toBe(150); // 50 + 100

      // 스택 오버플로우 없이 여러 번 전파
      for (let i = 0; i < 100; i++) {
        source.set(i);
      }
      expect(current.get()).toBe(199); // 99 + 100
    });
  });

  // ────────────────────────────────────────────
  // 시나리오 8: patch + snapshot 일관성
  // ────────────────────────────────────────────
  describe("시나리오 8: patch와 snapshot 일관성", () => {
    it("patch로 여러 atom을 한번에 변경하고 snapshot이 일관된다", () => {
      const store = new ContextQueryStore({
        x: 0,
        y: 0,
        z: 0,
        sum: derived((get) => (get("x") as number) + (get("y") as number) + (get("z") as number)),
        product: derived((get) => (get("x") as number) * (get("y") as number) * (get("z") as number)),
      });

      store.patch({ x: 2, y: 3, z: 4 });

      const snap = store.getSnapshot();
      expect(snap.x).toBe(2);
      expect(snap.y).toBe(3);
      expect(snap.z).toBe(4);
      expect(snap.sum).toBe(9);
      expect(snap.product).toBe(24);

      // snapshot 캐싱: 변경 없으면 같은 참조
      const snap2 = store.getSnapshot();
      expect(snap2).toBe(snap);

      // 변경 후 새 참조
      store.setAtomValue("x", 10);
      const snap3 = store.getSnapshot();
      expect(snap3).not.toBe(snap);
      expect(snap3.sum).toBe(17); // 10 + 3 + 4
    });
  });

  // ────────────────────────────────────────────
  // 시나리오 9: reset 동작
  // ────────────────────────────────────────────
  describe("시나리오 9: reset 동작", () => {
    it("개별 atom과 전체 reset이 정상 동작한다", () => {
      const store = new ContextQueryStore({
        count: 0,
        name: "initial",
        doubled: derived((get) => (get("count") as number) * 2),
      });

      store.setAtomValue("count", 42);
      store.setAtomValue("name", "changed");
      expect(store.getAtomValue("doubled")).toBe(84);

      // 개별 reset
      store.resetAtom("count");
      expect(store.getAtomValue("count")).toBe(0);
      expect(store.getAtomValue("doubled")).toBe(0);
      expect(store.getAtomValue("name")).toBe("changed");

      // 전체 reset
      store.setAtomValue("count", 99);
      store.resetAll();
      expect(store.getAtomValue("count")).toBe(0);
      expect(store.getAtomValue("name")).toBe("initial");
      expect(store.getAtomValue("doubled")).toBe(0);
    });
  });

  // ────────────────────────────────────────────
  // 시나리오 10: 구독 해제 및 메모리 관리
  // ────────────────────────────────────────────
  describe("시나리오 10: 구독 해제", () => {
    it("unsubscribe 후 리스너가 호출되지 않는다", () => {
      const store = new ContextQueryStore({
        value: 0,
        doubled: derived((get) => (get("value") as number) * 2),
      });

      const listener = vi.fn();
      const sub = store.subscribeToAtom("doubled", listener);

      store.setAtomValue("value", 1);
      expect(listener).toHaveBeenCalledTimes(1);

      sub.unsubscribe();
      store.setAtomValue("value", 2);
      expect(listener).toHaveBeenCalledTimes(1); // 더 이상 호출 안됨
      expect(store.getAtomValue("doubled")).toBe(4); // 값은 정상 계산
    });

    it("effect dispose 후 실행되지 않는다", () => {
      const system = createReactiveSystem();
      const count = system.signal(0);
      const log: number[] = [];

      const eff = system.effect(() => {
        log.push(count.get());
      });

      expect(log).toEqual([0]);

      count.set(1);
      expect(log).toEqual([0, 1]);

      eff.dispose();
      count.set(2);
      expect(log).toEqual([0, 1]); // dispose 후 실행 안됨
    });
  });
});
