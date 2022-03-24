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


3. 读取reactive变量会触发track，track内部会对effect进行收集，dep收集effect是为了trigger时去执行effect.run函数，为什么activeEffect也要去收集deps？是为了什么优化吗？或者是后面的某个模块会用到？

```ts
function trackEffects(dep) {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}
```
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

### slots

1. slots 只有在 `vue component` 有效，因此 `initProps` 应该在 setupComponent 中执行

```ts
// component.ts
export function setupComponent(instance) {
  initSlots(instance, instance.vnode.children);
}
```

2. 在 initProps 时，将 instance.vnode.children 赋值给 instance.slots

- 优化： 在 createVNode 时去判断 vnode 是否是 vue componet 以及 children 是否是 object；如果满足，则打上 `SLOT_CHILDREN` 的标记；在初始化时就可以判断此 vnode 是否需要 初始化 slots
- 具名插槽： 传入的 chilren 对象，并给 instance.slots 赋值对应的属性
- 作用域插槽： 将 `slots[key]` 对应的插槽赋值为一个函数，去调用 chilren 对应插入的函数并传入 props。 `slots[key]` 返回的是一个数组

```ts
// compoentSlots.ts
export function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlag.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
}

function normalizeObjectSlots(children, slots) {
  for (const key in children) {
    const value = children[key];
    slots[key] = (props) => normalizeSlotValue(value(props));
  }
}

export function normalizeSlotValue(slot) {
  return isArray(slot) ? slot : [slot];
}
```

3. 调用 renderSlots 获取 slot

- App 中使用插槽时 chilren 为 object，这是为了实现具名插槽
- App 中插入的 节点 由函数返回，这是为了实现作用域插槽，initSlots 时拿到的 children 内的 slot 函数调用并传入 props
- Foo 中插槽调用 renderSlots 将组件实例上挂载的 $slots 转换为虚拟节点

```ts
// index.html
const Foo = {
  render() {
    return h("div", {}, [
      renderSlots(this.$slots, "header", { data: "header" }),
      renderSlots(this.$slots, "footer", { data: "footer" }),
    ]);
  },
};

const App = {
  render() {
    return h(
      Foo,
      {},
      {
        header: ({ data }) => h("div", {}, "I am Foo " + data),
        footer: ({ data }) => h("div", {}, "I am Foo " + data),
      }
    );
  },
};
```

1. renderSlots 中调用 createVNode 创建虚拟节点

- slots 为组件实例上挂载的 $slots，包含了所有插入的返回节点的函数
- 获取对应的 slot 调用并传入 props，此 props 为 Foo 组件中传入的数据
- 获取到的 slot 时在 initSlots 时，设置为函数的

```ts
// renderSlots.ts
export function renderSlots(slots, name, props?) {
  const slot = slots[name];

  if (slot) {
    if (isFunction(slot)) {
      return createVNode("div", {}, slot(props));
    }
  }
}
```

#### 思考

1. 其实如果在 initSlots 中 `slots[key]` 赋值为 slot 数组，在 renderSlots 中遍历调用也不会报错，但为什么要这样返回函数呢

- 首先，返回函数的写法看上去确实好看一些
- 暂时还没有想到，也许看到后面，或者看 vue3 源码时能发现这样会有一些优点

```ts
function normalizeObjectSlots(children, slots) {
  for (const key in children) {
    const value = children[key];
    slots[key] = normalizeSlotValue(value); // value 为 函数
  }
}

export function renderSlots(slots, name, props?) {
  const slot = slots[name];

  // slot 是一个 函数数组
  if (slot) {
    if (isFunction(slot)) {
      return createVNode(
        "div",
        {},
        slot.map((v) => v(props))
      );
    }
  }
}
```
