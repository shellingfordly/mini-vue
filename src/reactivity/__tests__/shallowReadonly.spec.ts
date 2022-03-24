import { isProxy, isReadonly, shallowReadonly } from "../src/reactive";

describe("shallowReadonly", () => {
  it("should not make non-reactive properties reactive", () => {
    const shallowObj = shallowReadonly({ a: { b: 1 } });
    expect(isReadonly(shallowObj)).toBe(true);
    expect(isReadonly(shallowObj.a)).toBe(false);
    expect(isProxy(shallowObj)).toBe(true);
    expect(isProxy(shallowObj.a)).toBe(false);
  });

  it("create readonly", () => {
    const shallowObj = shallowReadonly({ a: { b: 1 } });

    console.warn = jest.fn();

    shallowObj.c = 2;
    expect(console.warn).toBeCalled();
    // 由于深层不是 reactive，对深层设置不会触发 console.warn
    shallowObj.a.b = 2;
  });
});
