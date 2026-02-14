import { useHydrateAtoms } from "jotai/utils";
import type { WritableAtom } from "jotai";

type AnyWritableAtom = WritableAtom<unknown, unknown[], unknown>;

export function HydrateAtoms({
  initialValues,
  children,
}: {
  initialValues: Iterable<readonly [AnyWritableAtom, unknown]>;
  children: React.ReactNode;
}) {
  useHydrateAtoms(initialValues);
  return children;
}
