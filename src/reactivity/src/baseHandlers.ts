import { isObjectOrArray } from "../../shared/index";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

function createGetter(isReadonly = false, shallow = false) {
  return (target, key, receiver) => {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    // 如果不是只读对象，收集依赖
    if (!isReadonly) {
      track(target, "get", key);
    }

    const res = Reflect.get(target, key, receiver);

    if (shallow) {
      return res;
    }

    if (isObjectOrArray(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    return res;
  };
}

function createSetter() {
  return (target, key, value, receiver) => {
    const res = Reflect.set(target, key, value, receiver);

    trigger(target, "set", key);
    return res;
  };
}

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    console.warn(`${target} of ${key} can't be setted, it's a readonly object`);
    return true;
  },
};

export const shallowReadonlyHandlers = Object.assign({}, readonlyHandlers, {
  get: shallowReadonlyGet,
});
