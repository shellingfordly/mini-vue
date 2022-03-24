import { effect, stop } from "../src/effect";
import { reactive } from "../src/reactive";

describe("effect", () => {
  it("should observe basic properties", () => {
    let doubleCount;
    const count = reactive({ value: 1 });

    effect(() => (doubleCount = count.value * 2));

    expect(doubleCount).toBe(2);

    // update
    count.value = 2;
    expect(doubleCount).toBe(4);
  });

  it("should observe runner", () => {
    let count = 10;

    const runner = effect(() => {
      count++;
      return "count";
    });
    // console.log(runner);
    expect(count).toBe(11);

    const r = runner();
    expect(count).toBe(12);
    expect(r).toBe("count");
  });

  it("should observe scheduler", () => {
    // 1. effect 的第二个参数
    // 2. 第一次执行时执行 fn
    // 3. update时执行 scheduler
    // 4. 执行 runner 时， 执行 fn

    let doubleCount;
    let run;
    const scheduler = jest.fn(() => {
      run = runner;
    });

    const count = reactive({ value: 1 });
    const runner = effect(
      () => {
        doubleCount = count.value * 2;
      },
      { scheduler }
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(doubleCount).toBe(2);

    count.value++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(doubleCount).toBe(2);
    run();
    expect(doubleCount).toBe(4);
  });

  it("should observe stop", () => {
    let doubleCount;
    const count = reactive({ value: 1 });
    const runner = effect(() => {
      doubleCount = count.value * 2;
    });

    count.value = 2;
    expect(count.value).toBe(2);
    expect(doubleCount).toBe(4);
    stop(runner);

    // count.value++ 实际上是 count.value = count.value + 1
    // 会触发 count get 函数，收集依赖(effect)
    count.value++;

    expect(count.value).toBe(3);
    expect(doubleCount).toBe(4);

    // 重新触发 effect.run
    runner();
    expect(doubleCount).toBe(6);
  });
});
1;
