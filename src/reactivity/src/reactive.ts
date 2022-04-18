import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

const reactiveMap = new Map();
const readonlyMap = new Map();

export const ReactiveFlags = {
  IS_REATIVE: "__v_is_Reactive",
  IS_READONLY: "__v_is_Readonly",
};

export function reactive(target) {
  return createReactiveObject(target, reactiveMap, mutableHandlers);
}

export function readonly(target) {
  return createReactiveObject(target, readonlyMap, readonlyHandlers);
}

export function isProxy(target) {
  return isReactive(target) || isReadonly(target);
}

export function isReactive(target) {
  return !!target[ReactiveFlags.IS_REATIVE];
}

export function isReadonly(target) {
  const res = target[ReactiveFlags.IS_READONLY];
  console.log(res, ReactiveFlags.IS_READONLY);

  return !!target[ReactiveFlags.IS_READONLY];
}

export function createReactiveObject(target, proxyMap, baseHandlers) {
  // 获取缓存
  const existingTarget = proxyMap.get(target);

  if (existingTarget) {
    return existingTarget;
  }

  const proxy = new Proxy(target, baseHandlers);

  // 设置缓存
  proxyMap.set(target, proxy);

  return proxy;
}
