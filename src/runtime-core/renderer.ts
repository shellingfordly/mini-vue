import { createComponentInstance, setupComponent } from "./component";
import {
  isArrayChildren,
  isCompoent,
  isElement,
  isTextChildren,
} from "./shapeFlags";
import { Fragment, Text } from "./vnode";
import { createAppAPI } from "./createApp";
import { effect } from "../reactivity/src";
import { isString } from "../shared";

export function createRenderer({ createElement, patchProps, insert }) {
  function render(vnode, container, parentInstance) {
    // 调用 patch 函数递归处理组件
    patch(null, vnode, container, parentInstance);
  }

  // 处理 元素 的函数 （vue组件元素 / element dom元素）
  function patch(n1, n2, container, parentInstance) {
    // 处理不同类型的 vnode 元素
    // 1. element
    // 2. vue compoennt

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
          // 处理 element 类型元素
          processElement(n1, n2, container, parentInstance);
        } else if (isCompoent(shapeFlag)) {
          // 处理 vue组件 类型元素
          processComponent(n1, n2, container, parentInstance);
        }
        break;
    }
  }

  /**
   * @description 处理 Fragment 节点
   * @param vnode
   * @param container
   */
  function processFragment(n1, n2, container, parentInstance) {
    mountChildren(null, n2, container, parentInstance);
  }

  /**
   * @description 处理文本节点
   * @param vnode
   * @param container
   */
  function proceeText(n1, n2, container) {
    const textNode = (n2.el = document.createTextNode(n2.children));
    container.append(textNode);
  }

  /**
   * @description 处理 element 类型元素
   *    此处的 element，是通过 createVNode 创建的虚拟节点 元素
   *    初始化之后才将 element 转化成了 真实dom
   *    判断调用 初始化 函数或是调用 更新 函数
   * @param vnode 虚拟节点
   * @param container 需要实际挂载的 容器 （真实dom元素）
   */
  function processElement(n1, n2, container, parentInstance) {
    if (!n1) {
      // init 调用 elment 元素初始化函数
      mountElement(n2, container, parentInstance);
    } else {
      // update
      patchElement(n1, n2, container, parentInstance);
    }
  }

  function patchElement(n1, n2, container, parentInstance) {
    console.log(n1, n2);
    if (n1 && isString(n1.children)) {
      if (n1.children !== n2.children) {
        // n1.children = n2.children;
        n1.el.textContent = n2.children;
      }
    } else {
      mountChildren(n1, n2, container, parentInstance);
    }
  }

  /**
   * @description element 类型元素 初始化函数
   * @param vnode
   * @param container
   */
  function mountElement(vnode, container, parentInstance) {
    // 根据 虚拟节点 属性 创建 element （真实dom）
    const { type, props } = vnode;

    const el = createElement(type);

    vnode.el = el;

    // 处理 子节点 （虚拟节点）
    const { shapeFlag, children } = vnode;

    if (isTextChildren(shapeFlag)) {
      el.textContent = children;
    } else if (isArrayChildren(shapeFlag)) {
      mountChildren(null, vnode, el, parentInstance);
    }

    // 处理节点属性props
    if (props) {
      for (const key in props) {
        const value = props[key];
        patchProps(el, key, value);
      }
    }
    // 添加到容器中
    insert(el, container);
  }

  /**
   * @description 处理 element 子节点
   *    遍历 vnode.children ，调用 patch 生成真实 dom元素
   * @param vnode
   * @param container 子节点容器，既父节点 vnode
   */
  function mountChildren(n1, n2, container, parentInstance) {
    if (!n1) {
      n2.children.forEach((child) => {
        patch(null, child, container, parentInstance);
      });
    } else {
      n2.children.forEach((child2, i) => {
        const child1 = n1.children[i];

        patchElement(child1, child2, container, parentInstance);
      });
    }
  }

  //
  /**
   * @description 处理 vue组件 类型元素
   * @param vnode
   * @param container
   */
  function processComponent(n1, n2, container, parentInstance) {
    // 调用组件挂载函数
    mountComponent(n2, container, parentInstance);
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
  function mountComponent(initialVNode, container, parentInstance) {
    // 创建 组件 实例
    const instance = createComponentInstance(initialVNode, parentInstance);

    // 初始化组件： 初始化 props、slots等等， 挂载 component 到组件实例上
    setupComponent(instance);
    // 渲染 render 返回值（虚拟节点）
    setupRnderEffect(instance, initialVNode, container);
  }

  /**
   * @description 渲染 render 返回值
   *    调用 patch 函数，将 render 返回的虚拟节点转换成 真实dom
   * @param instance
   * @param initialVNode
   * @param container
   */
  function setupRnderEffect(instance, initialVNode, container) {
    effect(() => {
      // 初始化
      if (!instance.isMounted) {
        const { proxy } = instance;
        // 执行 组件实例 上的 render 函数，拿到 虚拟节点树
        const subTree = instance.render.call(proxy);
        instance.subTree = subTree;

        // 调用 patch 处理 节点树
        patch(null, subTree, container, instance);

        // 在 patch 中真实生成了 真实dom 后，挂载到 vnode 上

        initialVNode.el = subTree.el;

        instance.isMounted = true;
      } else {
        //更新
        const { proxy } = instance;
        const currentSubTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        instance.subTree = currentSubTree;

        patch(prevSubTree, currentSubTree, container, instance);
        initialVNode.el = currentSubTree.el;
      }
    });
  }

  /**
   * @description 判断是否为 事件 key
   * @param key string
   * @returns
   */
  function isOnEvent(key): boolean {
    return /^on[A-Z]/.test(key);
  }

  return {
    createApp: createAppAPI(render),
  };
}
