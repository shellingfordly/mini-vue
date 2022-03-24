import { isFunction } from "../../shared";
import { createVNode } from "../vnode";

export function renderSlots(slots, name, props?) {
  const slot = slots[name];

  if (slot) {
    if (isFunction(slot)) {
      return createVNode("div", {}, slot(props));
    }
  }
}
