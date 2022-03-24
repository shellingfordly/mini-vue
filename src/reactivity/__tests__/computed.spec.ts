import { computed } from "../src/computed";
import { reactive } from "../src/reactive";

describe("computed", () => {
  it("create computed", () => {
    const count = reactive({ value: 1 });

    const doubleCount = computed(() => count.value * 2);

    expect(doubleCount.value).toBe(2);
  });

  it("should computed lazy", () => {

    const count = reactive({ value: 1 });

    const getter = jest.fn(() => count.value * 2);
    const doubleCount = computed(getter);

    // lazy
    expect(getter).not.toHaveBeenCalled();

    // get
    expect(doubleCount.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(1);

    // get again
    expect(doubleCount.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(1);

    // set count ---> update doubleCount
    count.value = 2;
    expect(getter).toHaveBeenCalledTimes(1);

    // update doubleCount
    expect(doubleCount.value).toBe(4);
    expect(getter).toHaveBeenCalledTimes(2);

    // get again after update doubleCount
    expect(doubleCount.value).toBe(4);
    expect(getter).toHaveBeenCalledTimes(2);
  });
});
