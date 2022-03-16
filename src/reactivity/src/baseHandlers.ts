import { isObject } from "../../shared";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags } from "./reactive";

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

function createGetter(isReadonly = false) {
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

    if (isObject(res)) {
      return reactive(res);
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
    console.warn(`${target} can't be setted, it's a readonly object`);
    return true;
  },
};
