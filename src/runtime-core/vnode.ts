/**
 * @description 创建一个虚拟节点对象
 * @param type 虚拟节点
 *    1. dom元素类型， nodeType
 *    2. vue 组件对象
 * @param props 节点属性
 * @param children 子（虚拟）节点
 * @returns vnode 虚拟节点
 */
export function createVNode(type, props?, children?) {
  const vnode = {
    type, // vue 组件对象
    props,
    children,
    el: null,
  };

  return vnode;
}

/**
 * @description 创建一个虚拟节点对象
 * @param type
 * @param props
 * @param children
 * @returns vnode 虚拟节点
 */
export function h(type, props?, children?) {
  return createVNode(type, props, children);
}
