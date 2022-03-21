const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const hasChange = (obj, newObj) => !Object.is(obj, newObj);

function createDep(effects) {
    const dep = new Set(effects);
    return dep;
}

let activeEffect = null;
let shouldTrack = false;
const tagetMap = new WeakMap();
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.fn = fn;
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
    }
    run() {
        // 失活的 effect 直接调用 fn
        if (!this.active) {
            return this.fn();
        }
        activeEffect = this;
        shouldTrack = true;
        const res = this.fn();
        activeEffect = null;
        shouldTrack = false;
        return res;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
function stop(runner) {
    runner.effect.stop();
}
function track(target, type, key) {
    if (!isTracking()) {
        return;
    }
    let depsMap = tagetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        tagetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = createDep();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
    }
}
function isTracking() {
    return shouldTrack && activeEffect !== null;
}
function trigger(target, type, key) {
    const depsMap = tagetMap.get(target);
    if (!depsMap) {
        return;
    }
    const dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return (target, key, receiver) => {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        // 如果不是只读对象，收集依赖
        if (!isReadonly) {
            track(target, "get", key);
        }
        const res = Reflect.get(target, key, receiver);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
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
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
        console.warn(`${target} can't be setted, it's a readonly object`);
        return true;
    },
};
Object.assign({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

const targetMap = new WeakMap();
var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_is_Reactive";
    ReactiveFlags["IS_READONLY"] = "__v_is_Readonly";
})(ReactiveFlags || (ReactiveFlags = {}));
function reactive(target) {
    return createReactiveObject(target, mutableHandlers);
}
function readonly(target) {
    return createReactiveObject(target, readonlyHandlers);
}
function isProxy(target) {
    return isReactive(target) || isReadonly(target);
}
function isReactive(target) {
    return !!target[ReactiveFlags.IS_REACTIVE];
}
function isReadonly(target) {
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

class ComputedRef {
    constructor(getter) {
        this._dirty = true;
        this._getter = getter;
        this._effect = new ReactiveEffect(getter, () => {
            this._dirty = true;
        });
    }
    get value() {
        if (this._dirty) {
            this._dirty = false;
            this._value = this._effect.run();
        }
        return this._value;
    }
}
function computed(getter) {
    return new ComputedRef(getter);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
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
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    const ref = new RefImpl(value);
    return ref;
}
function isRef(value) {
    return !!value.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key, receiver) {
            return unRef(Reflect.get(target, key, receiver));
        },
        set(target, key, value, receiver) {
            const oldValue = target[key];
            if (isRef(oldValue) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value, receiver);
            }
        },
    });
}

export { computed, effect, isProxy, isReactive, isReadonly, isRef, proxyRefs, reactive, readonly, ref, stop, unRef };
