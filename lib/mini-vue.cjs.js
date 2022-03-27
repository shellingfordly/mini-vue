'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Type;
(function (Type) {
    Type["Object"] = "Object";
    Type["Array"] = "Array";
    Type["String"] = "String";
    Type["Function"] = "Function";
})(Type || (Type = {}));
const toString = Object.prototype.toString;
function is(val, type) {
    return toString.call(val) === `[object ${type}]`;
}
const isObjectOrArray = (val) => isObject(val) || isArray(val);
const isObject = (val) => is(val, Type.Object);
const isArray = (val) => is(val, Type.Array);
const isString = (val) => is(val, Type.String);
const isFunction = (val) => is(val, Type.Function);
const hasChange = (obj, newObj) => !Object.is(obj, newObj);
const cameline = (str) => {
    return str.replace(/-(\w)/g, (_, c) => c.toUpperCase());
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return `on${capitalize(str)}`;
};

const publicPropertiesMap = {
    $el: (instance) => instance.vnode.el,
    $slots: (instance) => instance.slots,
};
const PublicInstanceProxyHandlers = {
    get({ _instance }, key) {
        const { setupState, props } = _instance;
        if (key in setupState) {
            return setupState[key];
        }
        if (key in props) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(_instance);
        }
    },
};

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

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
const shallowReadonlyHandlers = Object.assign({}, readonlyHandlers, {
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
function shallowReadonly(target) {
    return createReactiveObject(target, shallowReadonlyHandlers);
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

function emit(instance, event, ...args) {
    const handler = instance.props[toHandlerKey(cameline(event))];
    handler && handler(...args);
}

var ShapeFlag;
(function (ShapeFlag) {
    ShapeFlag[ShapeFlag["NUll"] = 0] = "NUll";
    ShapeFlag[ShapeFlag["ELEMENT"] = 1] = "ELEMENT";
    ShapeFlag[ShapeFlag["STATEFUL_COMPONENT"] = 2] = "STATEFUL_COMPONENT";
    ShapeFlag[ShapeFlag["TEXT_CHILDREN"] = 4] = "TEXT_CHILDREN";
    ShapeFlag[ShapeFlag["ARRAY_CHILDREN"] = 8] = "ARRAY_CHILDREN";
    ShapeFlag[ShapeFlag["SLOT_CHILDREN"] = 10] = "SLOT_CHILDREN";
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

function initSlots(instance, children) {
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
function normalizeSlotValue(slot) {
    return isArray(slot) ? slot : [slot];
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

function createComponentInstance(vnode, parent) {
    const instance = {
        vnode,
        type: vnode.type,
        proxy: {},
        setupState: {},
        props: {},
        provides: parent ? parent.provides : {},
        parent,
        emit: () => { },
        slots: {},
        isMounted: false,
        subTree: {},
    };
    instance.emit = emit.bind(null, instance);
    return instance;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    instance.proxy = new Proxy({ _instance: instance }, PublicInstanceProxyHandlers);
    const Component = instance.vnode.type;
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (isObject(setupResult)) {
        instance.setupState = proxyRefs(setupResult);
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
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
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
function createTextVNode(text, props = {}) {
    return createVNode(Text, props, text);
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
    if (shapeFlag & ShapeFlag.STATEFUL_COMPONENT) {
        if (isObject(children)) {
            shapeFlag |= ShapeFlag.SLOT_CHILDREN;
        }
    }
    return shapeFlag;
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer, null);
            },
        };
    };
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (isFunction(slot)) {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        if (currentInstance.parent &&
            currentInstance.provides === currentInstance.parent.provides) {
            currentInstance.provides = Object.create(currentInstance.parent.provides);
        }
        currentInstance.provides[key] = value;
    }
}
function inject(key) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        return currentInstance.parent.provides[key];
    }
}

function createRenderer({ createElement, patchProps, insert }) {
    function render(vnode, container, parentInstance) {
        patch(null, vnode, container, parentInstance);
    }
    function patch(n1, n2, container, parentInstance) {
        const { shapeFlag, type } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentInstance);
                break;
            case Text:
                proceeText(n1, n2, container);
                break;
            default:
                if (isElement(shapeFlag)) {
                    processElement(n1, n2, container, parentInstance);
                }
                else if (isCompoent(shapeFlag)) {
                    processComponent(n1, n2, container, parentInstance);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentInstance) {
        mountChildren(null, n2, container, parentInstance);
    }
    function proceeText(n1, n2, container) {
        const textNode = (n2.el = document.createTextNode(n2.children));
        container.append(textNode);
    }
    function processElement(n1, n2, container, parentInstance) {
        if (!n1) {
            mountElement(n2, container, parentInstance);
        }
        else {
            patchElement(n1, n2, container, parentInstance);
        }
    }
    function patchElement(n1, n2, container, parentInstance) {
        console.log(n1, n2);
        if (n1 && isString(n1.children)) {
            if (n1.children !== n2.children) {
                n1.el.textContent = n2.children;
            }
        }
        else {
            mountChildren(n1, n2, container, parentInstance);
        }
    }
    function mountElement(vnode, container, parentInstance) {
        const { type, props } = vnode;
        const el = createElement(type);
        vnode.el = el;
        const { shapeFlag, children } = vnode;
        if (isTextChildren(shapeFlag)) {
            el.textContent = children;
        }
        else if (isArrayChildren(shapeFlag)) {
            mountChildren(null, vnode, el, parentInstance);
        }
        if (props) {
            for (const key in props) {
                const value = props[key];
                patchProps(el, key, value);
            }
        }
        insert(el, container);
    }
    function mountChildren(n1, n2, container, parentInstance) {
        if (!n1) {
            n2.children.forEach((child) => {
                patch(null, child, container, parentInstance);
            });
        }
        else {
            n2.children.forEach((child2, i) => {
                const child1 = n1.children[i];
                patchElement(child1, child2, container, parentInstance);
            });
        }
    }
    function processComponent(n1, n2, container, parentInstance) {
        mountComponent(n2, container, parentInstance);
    }
    function mountComponent(initialVNode, container, parentInstance) {
        const instance = createComponentInstance(initialVNode, parentInstance);
        setupComponent(instance);
        setupRnderEffect(instance, initialVNode, container);
    }
    function setupRnderEffect(instance, initialVNode, container) {
        effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                instance.subTree = subTree;
                patch(null, subTree, container, instance);
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                const { proxy } = instance;
                const currentSubTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = currentSubTree;
                patch(prevSubTree, currentSubTree, container, instance);
                initialVNode.el = currentSubTree.el;
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProps(el, key, value) {
    if (isOnEvent(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, value);
    }
    else {
        el.setAttribute(key, value);
    }
}
function insert(el, parent) {
    parent.append(el);
}
function isOnEvent(key) {
    return /^on[A-Z]/.test(key);
}
const renderer = createRenderer({
    createElement,
    patchProps,
    insert,
});
const createApp = function (...args) {
    return renderer.createApp(...args);
};

exports.Fragment = Fragment;
exports.Text = Text;
exports.computed = computed;
exports.createApp = createApp;
exports.createAppAPI = createAppAPI;
exports.createElement = createElement;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.insert = insert;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.isRef = isRef;
exports.patchProps = patchProps;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.renderSlots = renderSlots;
exports.stop = stop;
exports.unRef = unRef;
//# sourceMappingURL=mini-vue.cjs.js.map
