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

### ref

1. proxyRefs 在设置 proxyRefInfo.age 的时候，设置的 value 按道理是一个普通数字，再做 isRef 判断的时候缺触发了 reactive 的 get 函数，为什么

```ts
it("proxyRefs", () => {
  const info = reactive({ age: ref(18) });

  const proxyRefInfo = proxyRefs(info);
  expect(proxyRefInfo.age).toBe(18);
  expect(info.age.value).toBe(18);
  expect(isRef(info.age)).toBe(true);

  proxyRefInfo.age = 20;

  expect(proxyRefInfo.age).toBe(20);
  expect(isRef(info.age)).toBe(true);
  expect(info.age.value).toBe(20);
});
```

```ts
export function isRef(value) {
  return !!value.__v_isRef;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      return unRef(Reflect.get(target, key, receiver));
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      if (isRef(oldValue) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    },
  });
}
```

2. [error] 在设置 proxyRefInfo.age 的时候 set 触发的 triggerEffects 里遍历 dep 时无法进入循环

```ts
export function triggerEffects(dep: Set<ReactiveEffect>) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
```
