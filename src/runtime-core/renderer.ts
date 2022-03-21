import { isArray, isObject, isString } from "../shared";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  // 调用 patch 函数递归处理组件
  patch(vnode, container);
}

// 处理 元素 的函数 （vue组件元素 / element dom元素）
function patch(vnode, container) {
  // 处理不同类型的 vnode 元素
  // 1. element
  // 2. vue compoennt

  const { type } = vnode;
  if (isString(type)) {
    // 处理 element 类型元素
    processElement(vnode, container);
  } else if (isObject(type)) {
    // 处理 vue组件 类型元素
    processComponent(vnode, container);
  }
}

/**
 * @description 处理 element 类型元素
 *    此处的 element，是通过 createVNode 创建的虚拟节点 元素
 *    初始化之后才将 element 转化成了 真实dom
 *    判断调用 初始化 函数或是调用 更新 函数
 * @param vnode 虚拟节点
 * @param container 需要实际挂载的 容器 （真实dom元素）
 */
function processElement(vnode, container) {
  // init 调用 elment 元素初始化函数
  mountElement(vnode, container);

  // update
}

/**
 * @description element 类型元素 初始化函数
 * @param vnode 
 * @param container 
 */
function mountElement(vnode, container) {
  // 根据 虚拟节点 属性 创建 element （真实dom）
  const { type, props, children } = vnode;

  const el = document.createElement(type);

  // 处理 子节点 （虚拟节点）
  mountChildren(children, el);

  if (props) {
    for (const key in props) {
      el.setAttribute(key, props[key]);
    }
  }

  container.append(el);
}

/**
 * @description 处理 element 子节点
 *    遍历 children ，调用 patch 生成真实 dom元素
 * @param children 
 * @param parent 
 */
function mountChildren(children, parent) {
  if (isString(children)) {
    parent.textContent = children;
  } else if (isArray(children)) {
    children.forEach((child) => {
      patch(child, parent);
    });
  }
}

// 
/**
 * @description 处理 vue组件 类型元素
 * @param vnode 
 * @param container 
 */
function processComponent(vnode, container) {
  // 调用组件挂载函数
  mountComponent(vnode, container);
}

/**
 * @name mountComponent
 * @description vue组件 处理函数
 *    初始化组件
 *    处理 render 渲染函数
 *    mountComponent 最终的归宿还是到了 mountElement 内，将虚拟节点转换成 真实dom
 * @param vnode 
 * @param container 
 */
function mountComponent(vnode, container) {
  // 创建 组件 实例
  const instance = createComponentInstance(vnode);

  // 初始化组件： 初始化 props、slots等等， 挂载 component 到组件实例上
  setupComponent(instance);
  // 渲染 render 返回值（虚拟节点）
  setupRnderEffect(instance, container);
}

/**
 * @description 渲染 render 返回值
 *    调用 patch 函数，将 render 返回的虚拟节点转换成 真实dom
 * @param instance 
 * @param container 
 */
function setupRnderEffect(instance, container) {
  // 执行 组件实例 上的 render 函数，拿到 虚拟节点树
  const subTree = instance.render();

  // 调用 patch 处理 节点树
  patch(subTree, container);
}
