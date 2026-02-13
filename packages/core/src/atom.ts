export interface AtomConfig<TValue = any> {
  readonly __type: 'atom';
  readonly initialValue: TValue;
  readonly equalityFn?: (a: TValue, b: TValue) => boolean;
}

export function atom<TValue>(
  initialValue: TValue,
  options?: { equalityFn?: (a: TValue, b: TValue) => boolean }
): AtomConfig<TValue> {
  return {
    __type: 'atom' as const,
    initialValue,
    equalityFn: options?.equalityFn,
  };
}

export function isAtomConfig(value: unknown): value is AtomConfig {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as any).__type === 'atom'
  );
}
