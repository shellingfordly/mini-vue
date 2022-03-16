## 疑问

### effect

1. 为什么要将 dep 存到 activeEffect 的 deps 中

- 猜测
  - 后面可能会有某个模块内部需要使用 activeEffect 去触发其他的 dep 执行 run 函数

```ts
export function trackEffects(dep) {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    (activeEffect as any).deps.push(dep);
  }
}
```

2. trigger 函数中为什么要声明新的 deps 变量去收集 dep，声明 effects 去收集 effect，不能直接使用 deps 吗

- 猜测
  - 不去直接使用 targetMap 上的 deps 是为了安全，只拿出 effect 去执行 run 函数即可，不会存在对 targetMap 上的属性做修改的风险

```ts
export function trigger(target, type, key) {
  let deps: Array<any> = [];
  const depsMap = targetMap.get(target);

  if (!depsMap) return;

  const dep = depsMap.get(key);

  deps.push(dep);

  const effects: Array<any> = [];
  deps.forEach((dep) => {
    effects.push(...dep);
  });
  triggerEffects(createDep(effects));
}

export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
```

2.1. effect.scheduler 是做什么的，暂时没看到后面，先留个疑问
