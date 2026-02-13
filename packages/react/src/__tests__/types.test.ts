import { describe, it, expectTypeOf } from 'vitest';
import { createContextQuery } from '../index';

describe('Type-level tests', () => {
  type TestAtoms = { count: number; name: string; items: string[] };

  const {
    useContextAtom,
    useContextAtomValue,
    useContextSetAtom,
    useSnapshot,
    useSnapshotValue,
    usePatch,
  } = createContextQuery<TestAtoms>();

  it('useContextAtom returns [value, setter] for correct types', () => {
    // Note: These are type-level checks only, not runtime calls
    type CountResult = ReturnType<typeof useContextAtom<'count'>>;
    expectTypeOf<CountResult>().toEqualTypeOf<readonly [number, (value: number | ((prev: number) => number)) => void]>();

    type NameResult = ReturnType<typeof useContextAtom<'name'>>;
    expectTypeOf<NameResult>().toEqualTypeOf<readonly [string, (value: string | ((prev: string) => string)) => void]>();
  });

  it('useContextAtomValue returns correct value type', () => {
    type CountValue = ReturnType<typeof useContextAtomValue<'count'>>;
    expectTypeOf<CountValue>().toEqualTypeOf<number>();

    type NameValue = ReturnType<typeof useContextAtomValue<'name'>>;
    expectTypeOf<NameValue>().toEqualTypeOf<string>();

    type ItemsValue = ReturnType<typeof useContextAtomValue<'items'>>;
    expectTypeOf<ItemsValue>().toEqualTypeOf<string[]>();
  });

  it('useContextSetAtom returns setter function', () => {
    type CountSetter = ReturnType<typeof useContextSetAtom<'count'>>;
    expectTypeOf<CountSetter>().toEqualTypeOf<(value: number | ((prev: number) => number)) => void>();
  });

  it('useSnapshot returns [TAtoms, patcher]', () => {
    type SnapshotResult = ReturnType<typeof useSnapshot>;
    expectTypeOf<SnapshotResult>().toEqualTypeOf<[TestAtoms, (newAtoms: Partial<TestAtoms>) => void]>();
  });

  it('useSnapshotValue returns TAtoms', () => {
    type SnapshotValueResult = ReturnType<typeof useSnapshotValue>;
    expectTypeOf<SnapshotValueResult>().toEqualTypeOf<TestAtoms>();
  });

  it('usePatch returns patch function', () => {
    type PatchResult = ReturnType<typeof usePatch>;
    expectTypeOf<PatchResult>().toEqualTypeOf<(newAtoms: Partial<TestAtoms>) => void>();
  });
});
