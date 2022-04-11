### 收集依赖

1. 总会有一种感觉在 tarck 的时候 activeEffect 是 null，就直接退出了 tarck 函数，为什么 trigger 里能调用到 effect.run 呢

有一个比较关键的点，当一个变量依赖另一个响应式变量的值时，就必然需要读取这个响应式变量，此时就会触发 get 函数内调用的 tarck 函数。

不管是 computed 计算属性还是 effect，都是想要在某个响应式变量发生改变时去做某件事，大部分情况下，传入 computed 和 effect 的回调函数内部都会调用这个响应式变量。因此，当 effect.run 执行时，内部执行到 this.fn（传入的回调）时，就会去触发 响应式变量的 get 内调用的 tarck 函数，此时 activeEffect 和 shouldTrack 还没有置空，就收集到了依赖。之后依赖变量改变时就会触发 trigger 去执行这些 effect 上的 run 函数

而 computed 不一样的是，在创建 effect 时，传入了第二个参数 scheduler，当有这个参数时，触发 trigger 执行的就不是 effect.run，而是 effect.scheduler。而 ComputedRef 内部利用一个\_dirty 变量去控制要不要执行(包含依赖变量的)回调函数。当依赖变量发生变化时，trigger 执行 effect.scheduler，打开了\_dirty 开关，再次获取计算属性时就会去重新执行回调函数，获取最新依赖值。

```ts
class ReactiveEffect {
  run() {
    activeEffect = this;
    shouldTrack = true;
    const res = this.fn();
    activeEffect = null;
    shouldTrack = false;
    return res;
  }
}

class ComputedRef {
  private _getter;
  private _dirty = true;
  private _value: any;
  private _effect: ReactiveEffect;

  constructor(getter) {
    this._getter = getter;

    this._effect = new ReactiveEffect(getter, () => {
      this._dirty = true;
    });
  }

  get value() {
    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run();
    }

    return this._value;
  }
}

const count = reactive({ value: 1 });
const doubleCount = computed(() => count.value * 2);

effect(() => {
  count.value;
});
```

### 导入报错

tsconfig 需要配置 moduleResolution 属性为 node，否则导入文件时需要写出 index，而不能自动需要 index 文件

![moduleResolution](./imgs/moduleResolution.png)

```json
{
  "compilerOptions": {
    "moduleResolution": "node"
  }
}
```

### 位运算

> 由于位运算更快，有时候可以使用 2 进制来表示数据类型，在进行判断时使用位运算，可以优化性能

- | (或运算) 都为 0 则为 0，否则为 1
- & (与运算) 都为 1 则 为 1，否则为 0

#### 二进制

二进制在做左移操作时，其实就等于十进制`乘2`，在做右移时就等于`除2`

- 1 ---> 0001
- 2 ---> 1 << 1, 1 左移一位
- 4 ---> 1 << 2, 1 左移两位
- 8 ---> 1 << 3, 1 左移三位

```ts
export enum ShapeFlag {
  ELEMENT = 1,
  STATEFUL_COMPONENT = 2, // 0010
  TEXT_CHILDREN = 4, // 0100
  ARRAY_CHILDREN = 8, // 1000
}
```

### 有限状态机

> 读取一组输入然后根据这些速入来更改为不同的状态

1. 是否存在 abc

- 逻辑
  - 如果 a 状态存在，返回下一个状态 b，以此类推
  - 最后一个状态 c 存在，返回 end 结束状态
  - 否则返回当前状态
- 执行过程
  - 声明初始状态 currentState， 设置为 waitForA
  - 循环字符串，将 currentState 更新为 waitForA 返回的状态
  - 更新后的状态可能是 新状态 b， 也可能是老状态 a
  - 知道状态为 end，return true 退出循环

```ts
export function stateMachine(str: string) {
  const waitForA = (char) => {
    if (char === "a") {
      return waitForB;
    }
    return waitForA;
  };

  const waitForB = (char) => {
    if (char === "b") {
      return waitForC;
    }
    return waitForB;
  };

  const waitForC = (char) => {
    if (char === "c") {
      return end;
    }
    return waitForC;
  };

  const end = () => {
    return end;
  };

  let currentState = waitForA;
  for (let i = 0; i < str.length; i++) {
    const nextState = currentState(str[i]);
    currentState = nextState;

    if (nextState === end) {
      return true;
    }
  }
  return false;
}
```

2. 记录匹配字符的 index

- 初始状态 a 成功时记录 startIndex，c 进入结束状态时记录 endIndex
- 循环中状态机为 end 时记录 [startIndex, endIndex]

```ts
export function stateMachine(str: string) {
  let i = 0;
  let startIndex;
  let endIndex;
  const result = [];

  const waitForA = (char) => {
    if (char === "a") {
      startIndex = i;
      return waitForB;
    }
    return waitForA;
  };

  const waitForB = (char) => {
    if (char === "b") {
      return waitForC;
    }
    return waitForB;
  };

  const waitForC = (char) => {
    if (char === "c") {
      endIndex = i;
      return end;
    }
    return waitForC;
  };

  const end = () => {
    return end;
  };

  let currentState = waitForA;
  for (let i = 0; i < str.length; i++) {
    const nextState = currentState(str[i]);
    currentState = nextState;

    if (nextState === end) {
      result.push([startIndex, endIndex]);
    }
  }
  return result;
}
```
