import { ShapeFlag } from "./shapeFlags";
import { isArray, isObject, isString } from "../shared";

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
  const shapeFlag = getShapeFlag(type, children);

  const vnode = {
    type, // vue 组件对象
    props,
    children,
    el: null,
    shapeFlag,
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

/**
 * @description 设置 vnode 的 shapeFlag 类型
 *    方便后面判断 vnode 属于什么类型的 节点， 组件/element/文本/数组
 * @param type vnode type
 * @param children vnode children
 * @returns shapeFlag number
 */
function getShapeFlag(type, children): ShapeFlag {
  let shapeFlag = ShapeFlag.NUll;

  if (isString(type)) {
    shapeFlag |= ShapeFlag.ELEMENT;
  } else if (isObject(type)) {
    shapeFlag |= ShapeFlag.STATEFUL_COMPONENT;
  }

  if (isString(children)) {
    shapeFlag |= ShapeFlag.TEXT_CHILDREN;
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlag.ARRAY_CHILDREN;
  }

  return shapeFlag;
}
