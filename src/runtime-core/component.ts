import { isObject } from "../shared";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

// 创建
export function createComponentInstance(vnode) {
  const instance = {
    vnode,
    type: vnode.type,
    proxy: {},
    setupState: {},
  };

  return instance;
}

//
export function setupComponent(instance) {
  // initProps(instance);
  // initSlots()

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
    const setupResult = setup();

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
