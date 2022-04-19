const targetMap = new Map();

let activeEffect: any = null;
let shouldTrack = false;

class EffectReactive {
  // deps: [];
  // active: boolean;

  constructor(public fn, public scheduler?) {}

  run() {
    activeEffect = this;
    shouldTrack = true;

    const res = this.fn();

    activeEffect = null;
    shouldTrack = false;

    return res;
  }

  stop() {}
}

export function effect(fn, config?) {
  const effect = new EffectReactive(fn);

  Object.assign(effect, config);

  const runner: any = effect.run.call(effect);

  // runner.effect = effect;

  return runner;
}

export function track(target, key) {
  if (!isTracking()) {
    return;
  }
  const depsMap = targetMap.get(target);

  const dep = depsMap.get(key);
  for (let i = 0; i < dep.length; i++) {
    const effect = dep[i];
    effect.run();
  }
}

export function tigger() {}

function isTracking() {
  return activeEffect && shouldTrack;
}
