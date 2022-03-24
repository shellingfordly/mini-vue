import { hasChange, isObjectOrArray } from "../../shared/index";
import { createDep } from "./dep";
import {
  isTracking,
  ReactiveEffect,
  trackEffects,
  triggerEffects,
} from "./effect";
import { reactive } from "./reactive";

class RefImpl<T = any> {
  private _value: T;
  private _rawValue: T;
  private dep: Set<ReactiveEffect | null>;

  public __v_isRef = true;

  constructor(value) {
    this._value = convert(value);
    this._rawValue = value;
    this.dep = createDep();
  }

  get value() {
    if (isTracking()) {
      trackEffects(this.dep);
    }
    return this._value;
  }

  set value(newValue) {
    if (hasChange(newValue, this._rawValue)) {
      this._value = convert(newValue);
      this._rawValue = newValue;
      triggerEffects(this.dep);
    }
  }
}

function convert(value) {
  return isObjectOrArray(value) ? reactive(value) : value;
}

export function ref<T = any>(value): RefImpl<T> {
  const ref = new RefImpl(value);

  return ref;
}

export function isRef(value) {
  return !!value.__v_isRef;
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      return unRef(Reflect.get(target, key, receiver));
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      if (isRef(oldValue) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    },
  });
}
