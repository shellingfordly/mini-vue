import { isObject } from "../../shared";
import { track } from "./effect";
import { reactive, readonly, ReactiveFlags } from "./reactive";

const get = createGetter();
const set = createSetter();

const readonlyGet = createGetter(true);
const shallow = createGetter(true, true);

function createGetter(isReadonly = false, isShallow = false) {
  return (target, key, receiver) => {
    if (key === ReactiveFlags.IS_REATIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key, receiver);

    if (!isReadonly) {
      track(target, key);
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
  };
}

function createSetter() {
  return (target, key, value, receiver) => {
    return Reflect.set(target, key, value, receiver);
  };
}

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set() {
    console.warn("readonly objct was not setted!");
    return true;
  },
};

export const shallowReadonlyHandlers = {
  shallow,
  set() {
    console.warn("shallowReadonly objct was not setted!");
    return true;
  },
};
