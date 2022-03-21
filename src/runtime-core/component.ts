import { isObject } from "../shared";
// 创建
export function createComponentInstance(vnode) {
  const instance = {
    vnode,
    type: vnode.type,
  };

  return instance;
}

//
export function setupComponent(instance) {
  // initProps()
  // initSlots()

  // 初始化 有状态的 组件
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  // 获取 setup 返回值

  // 获取 vue 组件， 在组件实例 instance 的 vnode 属性上的 type
  // 经常 createVNode 处理后的 type 就是 createApp 传入的 App （vue）组件
  const Component = instance.vnode.type;

  const { setup } = Component;

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

  // 将组件上的 render 函数赋到 组件实例上
  if (Component.render) {
    instance.render = Component.render;
  }
}
