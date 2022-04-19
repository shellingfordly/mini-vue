import { effect } from "../src/effect";
import { reactive } from "../src/reactive";

describe("effect", () => {
  it.only("first case", () => {
    const count = reactive({
      value: 1,
    });
    let doubleCount = 0;

    effect(() => {
      doubleCount = count.value * 2;
    });

    expect(count.value).toBe(1);
    expect(doubleCount).toBe(2);

    count.value = 2;
    expect(count.value).toBe(2);
    expect(doubleCount).toBe(4);
  });
});
