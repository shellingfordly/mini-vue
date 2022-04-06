var Type;
(function (Type) {
    Type["Object"] = "Object";
    Type["Array"] = "Array";
    Type["String"] = "String";
    Type["Function"] = "Function";
})(Type || (Type = {}));
const EMPTY_OBJ = {};
const toString = Object.prototype.toString;
function is(val, type) {
    return toString.call(val) === `[object ${type}]`;
}
const isObjectOrArray = (val) => isObject(val) || isArray(val);
const isObject = (val) => is(val, Type.Object);
const isArray = (val) => is(val, Type.Array);
const isString = (val) => is(val, Type.String);
const isFunction = (val) => is(val, Type.Function);
const isUndefined = (val) => val === undefined;
const isNull = (val) => val === null;
const isNullOrUndefined = (val) => isUndefined(val) || isNull(val);
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
    $props: (instance) => instance.props,
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
    ShapeFlag[ShapeFlag["SLOT_CHILDREN"] = 16] = "SLOT_CHILDREN";
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
        next: null,
        proxy: {},
        setupState: {},
        props: {},
        provides: parent ? parent.provides : {},
        parent,
        update: () => { },
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
        component: null,
        key: props && props.key,
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

function shouldUpdateComponent(n1, n2) {
    const { props: prevProps } = n1;
    const { props: nextProps } = n2;
    for (const key in prevProps) {
        if (Reflect.has(prevProps, key)) {
            if (prevProps[key] !== nextProps[key]) {
                return true;
            }
        }
    }
    return false;
}

function createRenderer({ createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, setElementText: hostSetElementText, remove: hostRemove, }) {
    function render(vnode, container, parentInstance) {
        patch(null, vnode, container, parentInstance, null);
    }
    function patch(n1, n2, container, parentInstance, anchor) {
        const { shapeFlag, type } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentInstance, anchor);
                break;
            case Text:
                proceeText(n1, n2, container);
                break;
            default:
                if (isElement(shapeFlag)) {
                    processElement(n1, n2, container, parentInstance, anchor);
                }
                else if (isCompoent(shapeFlag)) {
                    processComponent(n1, n2, container, parentInstance, anchor);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentInstance, anchor) {
        mountChildren(n2.children, container, parentInstance, anchor);
    }
    function proceeText(n1, n2, container) {
        const textNode = (n2.el = document.createTextNode(n2.children));
        container.append(textNode);
    }
    function processElement(n1, n2, container, parentInstance, anchor) {
        if (!n1) {
            mountElement(n2, container, parentInstance, anchor);
        }
        else {
            patchElement(n1, n2, container, parentInstance, anchor);
        }
    }
    function patchElement(n1, n2, container, parentInstance, anchor) {
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentInstance, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentInstance, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const c1 = n1.children;
        const nextShapeFlag = n2.shapeFlag;
        const c2 = n2.children;
        if (nextShapeFlag & ShapeFlag.TEXT_CHILDREN) {
            if (prevShapeFlag & ShapeFlag.ARRAY_CHILDREN) {
                unmountChildren(n1.children);
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            if (isTextChildren(prevShapeFlag)) {
                hostSetElementText(container, "");
                mountChildren(c2, container, parentInstance, anchor);
            }
            else {
                patchKeyedChaildren(c1, c2, container, parentInstance, anchor);
            }
        }
    }
    function patchKeyedChaildren(c1, c2, container, parentInstance, anchor) {
        let i = 0;
        const l2 = c2.length;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        const isSomeVNodeType = (n1, n2) => n1.type === n2.type && n1.key === n2.key;
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentInstance, anchor);
            }
            else {
                break;
            }
            i++;
        }
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentInstance, anchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        if (i > e1) {
            if (i <= e2) {
                const anchor = e2 + 1 < l2 ? c2[e2 + 1].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentInstance, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            const s1 = i;
            const s2 = i;
            const toBePatched = e2 - s2 + 1;
            const keyToNewINdexMap = new Map();
            const newIndexToOldIndexMap = new Array(toBePatched).fill(-1);
            let moved = true;
            let maxNewIndexSoFar = 0;
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                nextChild.key && keyToNewINdexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                let patched = 0;
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (prevChild.key !== null) {
                    newIndex = keyToNewINdexMap.get(prevChild.key);
                }
                else {
                    for (let i = s2; i <= e2; i++) {
                        if (isSomeVNodeType(prevChild, c2[i])) {
                            newIndex = i;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i;
                    patch(prevChild, c2[newIndex], container, parentInstance, null);
                    patched++;
                }
            }
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (moved) {
                    if (i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const oldProp = oldProps[key];
                const newProp = newProps[key];
                if (oldProp !== newProp) {
                    hostPatchProp(el, key, oldProp, newProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!Reflect.has(newProps, key)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentInstance, anchor) {
        const { type, props } = vnode;
        const el = hostCreateElement(type);
        vnode.el = el;
        const { shapeFlag, children } = vnode;
        if (isTextChildren(shapeFlag)) {
            el.textContent = children;
        }
        else if (isArrayChildren(shapeFlag)) {
            mountChildren(vnode.children, el, parentInstance, anchor);
        }
        if (props) {
            for (const key in props) {
                const value = props[key];
                hostPatchProp(el, key, null, value);
            }
        }
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentInstance, anchor) {
        children.forEach((child) => {
            patch(null, child, container, parentInstance, anchor);
        });
    }
    function processComponent(n1, n2, container, parentInstance, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentInstance, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
        }
    }
    function mountComponent(initialVNode, container, parentInstance, anchor) {
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentInstance));
        setupComponent(instance);
        setupRnderEffect(instance, initialVNode, container, anchor);
    }
    function setupRnderEffect(instance, initialVNode, container, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                instance.subTree = subTree;
                patch(null, subTree, container, instance, anchor);
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                const { proxy, vnode, next } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const currentSubTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = currentSubTree;
                patch(prevSubTree, currentSubTree, container, instance, anchor);
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}
function updateComponentPreRender(instance, nextVnode) {
    instance.vnode = nextVnode;
    instance.next = null;
    instance.props = nextVnode.props;
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, preValue, nextValue) {
    if (isOnEvent(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextValue);
    }
    else {
        if (isNullOrUndefined(nextValue)) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextValue);
        }
    }
}
function insert(el, parent, anchor) {
    parent.insertBefore(el, anchor || null);
}
function setElementText(el, text) {
    el.textContent = text;
}
function remove(el) {
    const parent = el.parentNode;
    parent && parent.removeChild(el);
}
function isOnEvent(key) {
    return /^on[A-Z]/.test(key);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    setElementText,
    remove,
});
const createApp = function (...args) {
    return renderer.createApp(...args);
};

export { Fragment, Text, computed, createApp, createAppAPI, createElement, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, insert, isProxy, isReactive, isReadonly, isRef, patchProp, provide, proxyRefs, reactive, readonly, ref, renderSlots, stop, unRef };
//# sourceMappingURL=mini-vue.esm.js.map
