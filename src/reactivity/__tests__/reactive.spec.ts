import { isReactive, isReadonly, reactive, readonly } from "../src/reactive";

describe("reactive", () => {
  it("create reactive", () => {
    const oriObj = { a: 1 };
    const newObj = reactive(oriObj);
    expect(newObj).not.toBe(oriObj);
    expect(newObj.a).toBe(1);
    expect("a" in newObj).toBe(true);
    expect(Object.keys(newObj)).toEqual(["a"]);
  });

  it("create readonly", () => {
    const oriObj = { a: 1 };
    const newObj = readonly(oriObj);

    console.warn = jest.fn();

    expect(newObj).not.toBe(oriObj);
    expect(newObj.a).toBe(1);
    expect("a" in newObj).toBe(true);
    expect(Object.keys(newObj)).toEqual(["a"]);

    newObj.a = 2;
    expect(console.warn).toBeCalled();
  });

  it("isReactive", () => {
    const oriObj = { a: 1 };
    const newObj = reactive(oriObj);

    expect(isReactive(newObj)).toBe(true);
    expect(isReactive(oriObj)).toBe(false);
  });

  it("isReadonly", () => {
    const oriObj = { a: 1 };
    const newObj = readonly(oriObj);

    expect(isReadonly(newObj)).toBe(true);
    expect(isReadonly(oriObj)).toBe(false);
  });
});
