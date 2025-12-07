# Context Query 사용 가이드

이 문서는 Context Query를 효과적으로 사용하기 위한 가이드입니다. Context Query는 강력한 도구이지만, **올바르게 사용해야** 그 장점을 최대한 활용할 수 있습니다.

## Context Query란?

Context Query는 React Context API와 React Query의 장점을 결합한 상태 관리 라이브러리입니다.

### 기존 도구들의 한계

| 도구 | 장점 | 한계 |
|------|------|------|
| **전역 상태 (Redux, Zustand)** | 앱 전체에서 상태 공유 가능 | 컴포넌트 트리 범위로 제한 불가, 라이프사이클 관리 어려움 |
| **React Context API** | 컴포넌트 트리 범위로 스코핑, 라이프사이클과 연동 | 일부 상태 변경 시 **모든** 하위 컴포넌트 리렌더링 |
| **React Query** | 구독 기반으로 필요한 컴포넌트만 리렌더링 | 전역 키 기반, 컴포넌트 스코프 클라이언트 상태에 부적합 |

### Context Query가 해결하는 문제

Context Query는 위 도구들이 **동시에 해결하지 못하는** 영역을 채웁니다:

```
┌─────────────────────────────────────────────────────────────┐
│                     Context Query                            │
│  ┌─────────────────────┐   ┌─────────────────────────────┐  │
│  │  Context API처럼    │ + │  React Query처럼            │  │
│  │  컴포넌트 트리 스코핑 │   │  구독 기반 선택적 리렌더링   │  │
│  │  라이프사이클 연동   │   │  필요한 컴포넌트만 업데이트  │  │
│  └─────────────────────┘   └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**핵심 가치:**
- **성능**: 구독한 atom이 변경될 때만 해당 컴포넌트가 리렌더링
- **개발 편의성**: useState와 유사한 친숙한 API
- **스코핑**: 컴포넌트 트리 범위로 상태 제한

---

## 올바른 사용법

### 1. 적절한 범위로 Provider 감싸기

Context Query는 **특정 기능 단위** 또는 **관련 컴포넌트 그룹**을 감싸는 용도로 사용하세요.

```tsx
// 좋은 예: 특정 기능(상품 상세)에 필요한 상태만 관리
function ProductDetailPage() {
  return (
    <ProductDetailProvider atoms={{
      product: initialProduct,
      selectedOption: null,
      quantity: 1
    }}>
      <ProductInfo />
      <OptionSelector />
      <QuantityControl />
      <AddToCartButton />
    </ProductDetailProvider>
  );
}
```

### 2. 독립적인 상태 인스턴스 활용

같은 Provider를 **형제 관계**로 여러 번 사용하면 독립적인 상태를 가집니다.

```tsx
// 좋은 예: 각 카드가 독립적인 상태를 가짐
function ProductList({ products }) {
  return (
    <div className="product-list">
      {products.map(product => (
        <ProductCardProvider key={product.id} atoms={{ product, isExpanded: false }}>
          <ProductCard />
        </ProductCardProvider>
      ))}
    </div>
  );
}
```

### 3. 훅 분리로 렌더링 최적화

읽기/쓰기 용도에 따라 적절한 훅을 선택하세요.

```tsx
// 값만 필요한 컴포넌트 - useContextAtomValue
function ProductPrice() {
  const product = useProductAtomValue("product");
  return <span>{product.price}원</span>;
}

// 업데이트만 필요한 컴포넌트 - useContextSetAtom (리렌더링 안됨!)
function AddToCartButton() {
  const setQuantity = useProductSetAtom("quantity");

  const handleClick = () => {
    setQuantity(prev => prev + 1);
  };

  return <button onClick={handleClick}>장바구니 추가</button>;
}

// 둘 다 필요한 컴포넌트 - useContextAtom
function QuantityControl() {
  const [quantity, setQuantity] = useProductAtom("quantity");

  return (
    <div>
      <button onClick={() => setQuantity(q => q - 1)}>-</button>
      <span>{quantity}</span>
      <button onClick={() => setQuantity(q => q + 1)}>+</button>
    </div>
  );
}
```

---

## 주의사항 (반드시 읽어주세요)

Context Query는 강력하지만, 잘못 사용하면 오히려 복잡성을 증가시킵니다.

### 1. 너무 큰 범위로 감싸지 마세요

**문제**: Provider를 앱 전체나 너무 넓은 범위로 감싸면, 상태가 **어디까지 영향을 미치는지 파악하기 어렵습니다**.

```tsx
// 나쁜 예: 앱 전체를 감싸면 전역 상태와 다를 바 없음
function App() {
  return (
    <AppWideProvider atoms={{ user: null, cart: [], settings: {} }}>
      <Header />
      <MainContent />
      <Footer />
      {/* 수백 개의 컴포넌트들... 어디서 이 상태를 쓰는지 파악 불가 */}
    </AppWideProvider>
  );
}
```

```tsx
// 좋은 예: 관련 컴포넌트만 감싸기
function CartSection() {
  return (
    <CartProvider atoms={{ items: [], coupon: null }}>
      <CartList />
      <CouponInput />
      <CartSummary />
    </CartProvider>
  );
}
```

**왜 문제인가요?**
- 상태 변경의 영향 범위를 추적하기 어려움
- 디버깅이 복잡해짐
- Context Query의 "스코핑" 장점이 사라짐
- 차라리 전역 상태 관리 도구(Zustand, Redux)를 쓰는 게 나음

**가이드라인**: Provider는 **관련된 10개 이하의 컴포넌트**를 감싸는 것을 권장합니다.

---

### 2. 같은 Provider를 중첩하지 마세요

**문제**: 하나의 Context Query Provider를 중첩해서 사용하면 **혼란이 가중**됩니다.

```tsx
// 나쁜 예: 같은 Provider 중첩 - 절대 하지 마세요!
function App() {
  return (
    <CounterProvider atoms={{ count: 0 }}>
      <Header />
      <CounterProvider atoms={{ count: 100 }}> {/* 중첩! */}
        <MainContent />
      </CounterProvider>
    </CounterProvider>
  );
}

function Header() {
  const [count] = useCounterAtom("count"); // 0
  return <div>Header: {count}</div>;
}

function MainContent() {
  const [count] = useCounterAtom("count"); // 100? 0? 혼란!
  return <div>Main: {count}</div>;
}
```

**왜 문제인가요?**
- 같은 훅을 호출해도 위치에 따라 다른 값이 나옴
- 코드 리뷰 시 어떤 Provider의 상태를 사용하는지 즉시 파악 불가
- 버그 발생 시 원인 추적이 매우 어려움
- 팀원들의 혼란 야기

```tsx
// 좋은 예: 서로 다른 Provider 사용
const { ContextQueryProvider: HeaderProvider, useContextAtom: useHeaderAtom } =
  createContextQuery<HeaderAtoms>();

const { ContextQueryProvider: ContentProvider, useContextAtom: useContentAtom } =
  createContextQuery<ContentAtoms>();

function App() {
  return (
    <HeaderProvider atoms={{ title: "My App" }}>
      <Header />
    </HeaderProvider>
    <ContentProvider atoms={{ data: [] }}>
      <MainContent />
    </ContentProvider>
  );
}
```

---

### 3. 전역 상태가 필요하면 전역 도구를 사용하세요

Context Query는 전역 상태 관리 도구가 **아닙니다**.

```tsx
// 나쁜 예: 인증 상태처럼 앱 전체에서 필요한 상태
<AuthContextQueryProvider atoms={{ user: null, isLoggedIn: false }}>
  <App />  {/* 이럴 거면 Zustand나 Redux를 쓰세요 */}
</AuthContextQueryProvider>

// 좋은 예: 전역 상태는 전역 도구로
// store/authStore.ts (Zustand)
export const useAuthStore = create((set) => ({
  user: null,
  isLoggedIn: false,
  login: (user) => set({ user, isLoggedIn: true }),
}));

// Context Query는 로컬 스코프에만 사용
<CommentSectionProvider atoms={{ comments: [], newComment: "" }}>
  <CommentList />
  <CommentInput />
</CommentSectionProvider>
```

---

## 언제 Context Query를 사용해야 하나요?

### 적합한 사용 사례

| 사용 사례 | 설명 |
|----------|------|
| **폼 그룹** | 여러 입력 필드가 서로 연관된 복잡한 폼 |
| **모달/다이얼로그** | 모달 내부에서만 공유되는 상태 |
| **위젯/카드** | 독립적인 UI 단위의 내부 상태 |
| **탭/아코디언** | 연관된 UI 요소들 간의 상태 공유 |
| **리스트 아이템** | 각 아이템이 독립적인 상태를 가지는 경우 |

### 부적합한 사용 사례

| 사용 사례 | 대안 |
|----------|------|
| **인증/사용자 정보** | 전역 상태 (Zustand, Redux) |
| **테마/다국어 설정** | React Context API (의도적 전체 리렌더링) |
| **서버 데이터 캐싱** | React Query, SWR |
| **앱 전체 설정** | 전역 상태 관리 도구 |

---

## 요약

### Do's (해야 할 것)
- 특정 기능/컴포넌트 그룹 단위로 Provider 사용
- 읽기/쓰기 용도에 맞는 훅 선택
- 독립적인 상태가 필요하면 형제 관계로 Provider 배치

### Don'ts (하지 말아야 할 것)
- 앱 전체를 하나의 Provider로 감싸기
- 같은 Provider를 중첩해서 사용
- 전역 상태가 필요한 곳에 Context Query 사용

---

## 다음 단계

- [API 레퍼런스](../README.ko.md) - 전체 API 문서
- [플레이그라운드](../packages/playground) - 실제 동작 예제
