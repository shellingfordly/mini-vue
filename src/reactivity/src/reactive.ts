import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers";

const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();

export enum ReactiveFlags {
  IS_REACTIVE = "__v_is_Reactive",
  IS_READONLY = "__v_is_Readonly",
}

export function reactive(target): typeof target {
  return createReactiveObject(target, reactiveMap, mutableHandlers);
}

export function readonly(target) {
  return createReactiveObject(target, readonlyMap, readonlyHandlers);
}

export function shallowReadonly(target) {
  return createReactiveObject(
    target,
    shallowReadonlyMap,
    shallowReadonlyHandlers
  );
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

function createReactiveObject(taget, proxyMap, baseHandlers) {
  const existingProxy = proxyMap.get(taget);

  // 使用缓存优化
  if (existingProxy) {
    return existingProxy;
  }

  const proxy = new Proxy(taget, baseHandlers);
  proxyMap.set(taget, proxy);

  return proxy;
}
