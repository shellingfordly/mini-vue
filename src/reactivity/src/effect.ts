import { createDep } from "./dep";

let activeEffect = null;
let shouldTrack = false;

const tagetMap = new WeakMap();

class ReactiveEffect {
  deps = [];
  active = true;

  constructor(public fn, public scheduler) {}

  run() {
    // 当执行过 stop 之后，清除掉了 effect，就不需要做 activeEffect 赋值操作
    // 当外部执行 effect 返回 runner 时，直接调用 fn 即可
    // active：effect 状态，失活时不再自动触发，需要用户手动触发 runner
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

// 清楚dep收集的effect
function cleanupEffect(effect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });

  // dep 收集的 effect 清空后，对应 effect 绑定的 deps 已经没有意义了，也可以清空了
  effect.deps.length = 0;
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);

  _effect.run();

  const runner = _effect.run.bind(_effect);
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

function trackEffects(dep) {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

function isTracking() {
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

export function triggerEffects(dep) {
  dep.forEach((effect) => {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  });
}
