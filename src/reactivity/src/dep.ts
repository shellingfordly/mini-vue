import { ReactiveEffect } from "./effect";

export function createDep(effects?: ReactiveEffect[]): Set<ReactiveEffect> {
  const dep = new Set(effects);
  return dep;
}
