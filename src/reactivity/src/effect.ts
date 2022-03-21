import { createDep } from "./dep";

let activeEffect: ReactiveEffect | null = null;
let shouldTrack = false;

const tagetMap = new WeakMap();

export class ReactiveEffect {
  deps: Set<ReactiveEffect | null>[] = [];
  active = true;

  constructor(public fn, public scheduler) {}

  run() {
    // 失活的 effect 直接调用 fn
    if (!this.active) {
      return this.fn();
    }

    activeEffect = this;
    shouldTrack = true;

    const res = this.fn();

    activeEffect = null;
    shouldTrack = false;

    return res;
  }

  stop() {
    if (this.active) {
      cleanupEffect(this);

      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });

  effect.deps.length = 0;
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);

  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}

export function track(target, type, key) {
  if (!isTracking()) {
    return;
  }

  let depsMap = tagetMap.get(target);

  if (!depsMap) {
    depsMap = new Map();
    tagetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);

  if (!dep) {
    dep = createDep();

    depsMap.set(key, dep);
  }

  trackEffects(dep);
}

export function trackEffects(dep: Set<ReactiveEffect | null>) {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect?.deps.push(dep);
  }
}

export function isTracking() {
  return shouldTrack && activeEffect !== null;
}

export function trigger(target, type, key) {
  const depsMap = tagetMap.get(target);

  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);

  triggerEffects(dep);
}

export function triggerEffects(dep: Set<ReactiveEffect | null>) {
  for (const effect of dep) {
    if (effect?.scheduler) {
      effect?.scheduler();
    } else {
      effect?.run();
    }
  }
}
