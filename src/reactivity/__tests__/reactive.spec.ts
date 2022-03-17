import {
  isProxy,
  isReactive,
  isReadonly,
  reactive,
  readonly,
} from "../src/reactive";

describe("reactive", () => {
  it("create reactive", () => {
    const oriObj = { a: 1 };
    const newObj = reactive(oriObj);
    expect(newObj).not.toBe(oriObj);
    expect(newObj.a).toBe(1);
    expect("a" in newObj).toBe(true);
    expect(Object.keys(newObj)).toEqual(["a"]);
    expect(isProxy(newObj)).toBe(true);
  });

  it("create readonly", () => {
    const oriObj = { a: 1 };
    const newObj = readonly(oriObj);

    console.warn = jest.fn();

    expect(newObj).not.toBe(oriObj);
    expect(newObj.a).toBe(1);
    expect("a" in newObj).toBe(true);
    expect(Object.keys(newObj)).toEqual(["a"]);
    expect(isProxy(newObj)).toBe(true);

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

  it("nested reactive object", () => {
    const reactObj = reactive({
      info: {
        name: "Tom",
        age: 18,
      },
      arr: [{ id: 1 }, { id: 2 }],
    });

    expect(isReactive(reactObj)).toBe(true);
    expect(isReactive(reactObj.info)).toBe(true);
    expect(isReactive(reactObj.arr)).toBe(true);
    expect(isReactive(reactObj.arr[0])).toBe(true);
  });

  it("nested readonly object", () => {
    const reactObj = readonly({
      info: {
        name: "Tom",
        age: 18,
      },
      arr: [{ id: 1 }, { id: 2 }],
    });

    expect(isReadonly(reactObj)).toBe(true);
    expect(isReadonly(reactObj.info)).toBe(true);
    expect(isReadonly(reactObj.arr)).toBe(true);
    expect(isReadonly(reactObj.arr[0])).toBe(true);
  });
});
