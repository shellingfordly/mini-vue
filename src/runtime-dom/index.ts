import { createRenderer } from "../runtime-core";

export function createElement(type) {
  return document.createElement(type);
}

export function patchProps(el, key, value) {
  if (isOnEvent(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, value);
  } else {
    el.setAttribute(key, value);
  }
}

export function insert(el, parent) {
  parent.append(el);
}

/**
 * @description 判断是否为 事件 key
 * @param key string
 * @returns
 */
function isOnEvent(key): boolean {
  return /^on[A-Z]/.test(key);
}

const renderer: any = createRenderer({
  createElement,
  patchProps,
  insert,
});

export const createApp = function (...args) {
  return renderer.createApp(...args);
};

export * from "../runtime-core";
