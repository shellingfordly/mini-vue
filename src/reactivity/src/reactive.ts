import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers";

const targetMap = new WeakMap();

export enum ReactiveFlags {
  IS_REACTIVE = "__v_is_Reactive",
  IS_READONLY = "__v_is_Readonly",
}

export function reactive(target): typeof target {
  return createReactiveObject(target, mutableHandlers);
}

export function readonly(target) {
  return createReactiveObject(target, readonlyHandlers);
}

export function shallowReadonly(target) {
  return createReactiveObject(target, shallowReadonlyHandlers);
}

export function isProxy(target) {
  return isReactive(target) || isReadonly(target);
}

export function isReactive(target) {
  return !!target[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(target) {
  return !!target[ReactiveFlags.IS_READONLY];
}

function createReactiveObject(taget, baseHandlers) {
  const oldTarget = targetMap.has(taget);

  if (oldTarget) {
    return oldTarget;
  }

  const result = new Proxy(taget, baseHandlers);

  return result;
}
