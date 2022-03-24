import { effect } from "../src/effect";
import { reactive } from "../src/reactive";
import { ref, isRef, unRef, proxyRefs } from "../src/ref";

describe("ref", () => {
  it("create ref object", () => {
    const count = ref(0);
    expect(count.value).toBe(0);
  });

  it("effect ref", () => {
    let doubleCount;
    const count = ref(1);
    expect(count.value).toBe(1);

    effect(() => {
      doubleCount = count.value * 2;
    });

    expect(doubleCount).toBe(2);

    count.value = 2;
    expect(doubleCount).toBe(4);
  });

  it("object ref", () => {
    let name = "";
    const info = ref({
      lastName: "xxx",
      firstName: "sss",
    });

    effect(() => {
      name = info.value.lastName + info.value.firstName;
    });

    expect(name).toBe("xxxsss");

    info.value.lastName = "sss";
    expect(name).toBe("ssssss");
  });

  it("isRef", () => {
    const count = ref(1);

    expect(isRef(count)).toBe(true);
    expect(isRef(1)).toBe(false);
  });

  it("unRef", () => {
    const count = ref(1);

    expect(unRef(count)).toBe(1);
    expect(unRef(1)).toBe(1);
  });

  it("proxyRefs", () => {
    const info = reactive({ age: ref(18) });

    const proxyRefInfo = proxyRefs(info);
    expect(proxyRefInfo.age).toBe(18);
    expect(info.age.value).toBe(18);
    expect(isRef(info.age)).toBe(true);

    // proxyRefInfo.age = 20;

    // expect(proxyRefInfo.age).toBe(20);
    // expect(isRef(info.age)).toBe(true);
    // expect(info.age.value).toBe(20);
  });
});
