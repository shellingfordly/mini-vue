import { isObject } from "../shared";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initProps } from "./componentProps";
import { shallowReadonly } from "../reactivity/src/reactive";
import { emit } from "./componentEmit";
import { initSlots } from "./componentSlots";

// 创建
export function createComponentInstance(vnode, parent) {
  const instance = {
    vnode,
    type: vnode.type,
    proxy: {},
    setupState: {},
    props: {},
    provides: parent ? parent.provides : {},
    parent,
    emit: () => {},
    slots: {},
  };

  instance.emit = emit.bind(null, instance) as any;

  return instance;
}

//
export function setupComponent(instance) {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);

  // 初始化 有状态的 组件
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  // 将 setup 返回的数据对象设置给 代理对象
  // 在后续使用 bind 绑定到 render 函数上，这样 render 内部就可以直接使用 setupState 上的数据
  instance.proxy = new Proxy(
    { _instance: instance },
    PublicInstanceProxyHandlers
  );

  // 获取 vue 组件， 在组件实例 instance 的 vnode 属性上的 type
  // 经常 createVNode 处理后的 type 就是 createApp 传入的 App （vue）组件
  const Component = instance.vnode.type;

  const { setup } = Component;

  // 获取 setup 返回值
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
  // setup 的返回值
  // 1. function jsx 组件
  // 2. object 只是 template 中使用的数据对象

  if (isObject(setupResult)) {
    instance.setupState = setupResult;
  }

  // 处理组件 render
  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;
  const proxy = instance.proxy;

  // 将组件上的 render 函数赋到 组件实例上
  if (Component.render) {
    instance.render = Component.render.bind(proxy);
  }
}

let currentInstance = null;

/**
 * @description 获取当前组件实例
 *    该方法只允许在setup内部调用，因此在调用setup时去给 currentInstance 赋值，结束后清空
 * @returns
 */
export function getCurrentInstance() {
  return currentInstance;
}

/**
 * @description 设置组件实例对象
 *     currentInstance = instance 这样一句简单的赋值 抽取为函数的好处
 *     方便调试错误，当对 currentInstance 错误赋值时，只需在此处 断点 就可以查询到调用过设置位置
 *     如果直接写 currentInstance = instance 的话，查错时很难知道在代码的哪一块设置的
 * @param instance
 */
function setCurrentInstance(instance) {
  currentInstance = instance;
}
