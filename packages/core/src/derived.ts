export interface DerivedAtomConfig<TValue = any> {
  readonly __type: 'derived';
  readonly read: (get: (key: string) => any) => TValue;
}

export function derived<TValue>(
  readFn: (get: (key: string) => any) => TValue
): DerivedAtomConfig<TValue> {
  return {
    __type: 'derived' as const,
    read: readFn,
  };
}

export function isDerivedAtom(value: unknown): value is DerivedAtomConfig {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as any).__type === 'derived' &&
    typeof (value as any).read === 'function'
  );
}
