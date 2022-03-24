import { isArray } from "../shared";
import { ShapeFlag } from "./shapeFlags";

export function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlag.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
}

function normalizeObjectSlots(children, slots) {
  for (const key in children) {
    const value = children[key];
    slots[key] = (props) => normalizeSlotValue(value(props));
  }
}

export function normalizeSlotValue(slot) {
  return isArray(slot) ? slot : [slot];
}
