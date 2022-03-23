'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Type;
(function (Type) {
    Type["Object"] = "Object";
    Type["Array"] = "Array";
    Type["String"] = "String";
})(Type || (Type = {}));
const toString = Object.prototype.toString;
function is(val, type) {
    return toString.call(val) === `[object ${type}]`;
}
const isObjectOrArray = (val) => isObject(val) || isArray(val);
const isObject = (val) => is(val, Type.Object);
const isArray = (val) => is(val, Type.Array);
const isString = (val) => is(val, Type.String);
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
        activeEffect === null || activeEffect === void 0 ? void 0 : activeEffect.deps.push(dep);
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
        if (effect === null || effect === void 0 ? void 0 : effect.scheduler) {
            effect === null || effect === void 0 ? void 0 : effect.scheduler();
        }
        else {
            effect === null || effect === void 0 ? void 0 : effect.run();
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
        if (!isReadonly) {
            track(target, "get", key);
        }
        const res = Reflect.get(target, key, receiver);
        if (shallow) {
            return res;
        }
        if (isObjectOrArray(res)) {
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
    return isObjectOrArray(value) ? reactive(value) : value;
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

const publicPropertiesMap = {
    $el: (instance) => instance.vnode.el,
};
const PublicInstanceProxyHandlers = {
    get({ _instance }, key) {
        const { setupState } = _instance;
        if (key in setupState) {
            return setupState[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(_instance);
        }
    },
};

function createComponentInstance(vnode) {
    const instance = {
        vnode,
        type: vnode.type,
        proxy: {},
        setupState: {},
    };
    return instance;
}
function setupComponent(instance) {
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    instance.proxy = new Proxy({ _instance: instance }, PublicInstanceProxyHandlers);
    const Component = instance.vnode.type;
    const { setup } = Component;
    if (setup) {
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (isObject(setupResult)) {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    const proxy = instance.proxy;
    if (Component.render) {
        instance.render = Component.render.bind(proxy);
    }
}

var ShapeFlag;
(function (ShapeFlag) {
    ShapeFlag[ShapeFlag["NUll"] = 0] = "NUll";
    ShapeFlag[ShapeFlag["ELEMENT"] = 1] = "ELEMENT";
    ShapeFlag[ShapeFlag["STATEFUL_COMPONENT"] = 2] = "STATEFUL_COMPONENT";
    ShapeFlag[ShapeFlag["TEXT_CHILDREN"] = 4] = "TEXT_CHILDREN";
    ShapeFlag[ShapeFlag["ARRAY_CHILDREN"] = 8] = "ARRAY_CHILDREN";
})(ShapeFlag || (ShapeFlag = {}));
function isElement(shapeFlag) {
    return shapeFlag & ShapeFlag.ELEMENT;
}
function isCompoent(shapeFlag) {
    return shapeFlag & ShapeFlag.STATEFUL_COMPONENT;
}
function isTextChildren(shapeFlag) {
    return shapeFlag & ShapeFlag.TEXT_CHILDREN;
}
function isArrayChildren(shapeFlag) {
    return shapeFlag & ShapeFlag.ARRAY_CHILDREN;
}

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    const { shapeFlag } = vnode;
    if (isElement(shapeFlag)) {
        processElement(vnode, container);
    }
    else if (isCompoent(shapeFlag)) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const { type, props, children } = vnode;
    const el = document.createElement(type);
    vnode.el = el;
    mountChildren(vnode, el);
    if (props) {
        for (const key in props) {
            const value = props[key];
            if (isOnEvent(key)) {
                const event = key.slice(2).toLowerCase();
                el.addEventListener(event, props[key]);
            }
            else {
                el.setAttribute(key, value);
            }
        }
    }
    container.append(el);
}
function mountChildren(vnode, container) {
    const { shapeFlag, children } = vnode;
    if (isTextChildren(shapeFlag)) {
        container.textContent = children;
    }
    else if (isArrayChildren(shapeFlag)) {
        children.forEach((child) => {
            patch(child, container);
        });
    }
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(initialVNode, container) {
    const instance = createComponentInstance(initialVNode);
    setupComponent(instance);
    setupRnderEffect(instance, initialVNode, container);
}
function setupRnderEffect(instance, initialVNode, container) {
    const subTree = instance.render();
    patch(subTree, container);
    initialVNode.el = subTree.el;
}
function isOnEvent(key) {
    return /^on[A-Z]/.test(key);
}

function createVNode(type, props, children) {
    const shapeFlag = getShapeFlag(type, children);
    const vnode = {
        type,
        props,
        children,
        el: null,
        shapeFlag,
    };
    return vnode;
}
function h(type, props, children) {
    return createVNode(type, props, children);
}
function getShapeFlag(type, children) {
    let shapeFlag = ShapeFlag.NUll;
    if (isString(type)) {
        shapeFlag |= ShapeFlag.ELEMENT;
    }
    else if (isObject(type)) {
        shapeFlag |= ShapeFlag.STATEFUL_COMPONENT;
    }
    if (isString(children)) {
        shapeFlag |= ShapeFlag.TEXT_CHILDREN;
    }
    else if (isArray(children)) {
        shapeFlag |= ShapeFlag.ARRAY_CHILDREN;
    }
    return shapeFlag;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

exports.computed = computed;
exports.createApp = createApp;
exports.effect = effect;
exports.h = h;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.isRef = isRef;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.stop = stop;
exports.unRef = unRef;
//# sourceMappingURL=mini-vue.cjs.js.map
