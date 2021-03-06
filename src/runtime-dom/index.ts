import { createRenderer } from "../runtime-core";
import { isNullOrUndefined } from "../shared";

export function createElement(type) {
  return document.createElement(type);
}

export function patchProp(el, key, preValue, nextValue) {
  if (isOnEvent(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, nextValue);
  } else {
    if (isNullOrUndefined(nextValue)) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextValue);
    }
  }
}

export function insert(el, parent, anchor) {
  parent.insertBefore(el, anchor || null);
}

function setElementText(el, text) {
  el.textContent = text;
}

function remove(el) {
  const parent = el.parentNode;
  parent && parent.removeChild(el);
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
  patchProp,
  insert,
  setElementText,
  remove,
});

export const createApp = function (...args) {
  return renderer.createApp(...args);
};

export * from "../runtime-core";
