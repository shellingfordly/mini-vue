import { createComponentInstance, setupComponent } from "./component";
import {
  isArrayChildren,
  isCompoent,
  isElement,
  isTextChildren,
  ShapeFlag,
} from "./shapeFlags";
import { Fragment, Text } from "./vnode";
import { createAppAPI } from "./createApp";
import { effect } from "../reactivity/src";
import { EMPTY_OBJ, isString } from "../shared";

export function createRenderer({
  createElement: hostCreateElement,
  patchProp: hostPatchProp,
  insert: hostInsert,
  setElementText: hostSetElementText,
  remove: hostRemove,
}) {
  function render(vnode, container, parentInstance) {
    // 调用 patch 函数递归处理组件
    patch(null, vnode, container, parentInstance, null);
  }

  // 处理 元素 的函数 （vue组件元素 / element dom元素）
  function patch(n1, n2, container, parentInstance, anchor) {
    // 处理不同类型的 vnode 元素
    // 1. element
    // 2. vue compoennt

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
          // 处理 element 类型元素
          processElement(n1, n2, container, parentInstance, anchor);
        } else if (isCompoent(shapeFlag)) {
          // 处理 vue组件 类型元素
          processComponent(n1, n2, container, parentInstance, anchor);
        }
        break;
    }
  }

  /**
   * @description 处理 Fragment 节点
   * @param vnode
   * @param container
   */
  function processFragment(n1, n2, container, parentInstance, anchor) {
    mountChildren(n2.children, container, parentInstance, anchor);
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
  function processElement(n1, n2, container, parentInstance, anchor) {
    if (!n1) {
      // init 调用 elment 元素初始化函数
      mountElement(n2, container, parentInstance, anchor);
    } else {
      // update
      patchElement(n1, n2, container, parentInstance, anchor);
    }
  }

  /**
   * @description 更新 element
   * @param n1
   * @param n2
   * @param container
   * @param parentInstance
   */
  function patchElement(n1, n2, container, parentInstance, anchor) {
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    // 需要给 n2.el 赋值，否则后面拿不到el
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
    } else {
      if (isTextChildren(prevShapeFlag)) {
        hostSetElementText(container, "");
        mountChildren(c2, container, parentInstance, anchor);
      } else {
        patchKeyedChaildren(c1, c2, container, parentInstance, anchor);
      }
    }
  }

  function patchKeyedChaildren(c1, c2, container, parentInstance, anchor) {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;
    const isSomeVNodeType = (n1, n2) =>
      n1.type === n2.type && n1.key === n2.key;

    // 对比左侧虚拟节点
    while (i <= e1 && i <= e2) {
      // 获取 左侧 节点
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSomeVNodeType(n1, n2)) {
        // 相同节点去调用patch对比属性以及子节点
        patch(n1, n2, container, parentInstance, anchor);
      } else {
        // 不同则 退出，i 停在 c2 子节点中出现的第一个新节点位置处
        break;
      }
      i++;
    }

    // 对比右侧虚拟节点
    while (i <= e1 && i <= e2) {
      // 获取 右侧 节点
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentInstance, anchor);
      } else {
        // 出现不同时，e1和 e2 停在 c1 中出现 第一个 c2 没有的节点位置处
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
    } else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      hostRemove(el);
    }
  }

  /**
   * @description 更新 props
   * @param el
   * @param oldProps
   * @param newProps
   */
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

  /**
   * @description element 类型元素 初始化函数
   * @param vnode
   * @param container
   */
  function mountElement(vnode, container, parentInstance, anchor) {
    // 根据 虚拟节点 属性 创建 element （真实dom）
    const { type, props } = vnode;

    const el = hostCreateElement(type);

    vnode.el = el;

    // 处理 子节点 （虚拟节点）
    const { shapeFlag, children } = vnode;

    if (isTextChildren(shapeFlag)) {
      el.textContent = children;
    } else if (isArrayChildren(shapeFlag)) {
      mountChildren(vnode.children, el, parentInstance, anchor);
    }

    // 处理节点属性props
    if (props) {
      for (const key in props) {
        const value = props[key];
        hostPatchProp(el, key, null, value);
      }
    }
    // 添加到容器中
    hostInsert(el, container, anchor);
  }

  /**
   * @description 处理 element 子节点
   *    遍历 vnode.children ，调用 patch 生成真实 dom元素
   * @param vnode
   * @param container 子节点容器，既父节点 vnode
   */
  function mountChildren(children, container, parentInstance, anchor) {
    children.forEach((child) => {
      patch(null, child, container, parentInstance, anchor);
    });
  }

  //
  /**
   * @description 处理 vue组件 类型元素
   * @param vnode
   * @param container
   */
  function processComponent(n1, n2, container, parentInstance, anchor) {
    // 调用组件挂载函数
    mountComponent(n2, container, parentInstance, anchor);
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
  function mountComponent(initialVNode, container, parentInstance, anchor) {
    // 创建 组件 实例
    const instance = createComponentInstance(initialVNode, parentInstance);

    // 初始化组件： 初始化 props、slots等等， 挂载 component 到组件实例上
    setupComponent(instance);
    // 渲染 render 返回值（虚拟节点）
    setupRnderEffect(instance, initialVNode, container, anchor);
  }

  /**
   * @description 渲染 render 返回值
   *    调用 patch 函数，将 render 返回的虚拟节点转换成 真实dom
   * @param instance
   * @param initialVNode
   * @param container
   */
  function setupRnderEffect(instance, initialVNode, container, anchor) {
    effect(() => {
      // 初始化
      if (!instance.isMounted) {
        const { proxy } = instance;
        // 执行 组件实例 上的 render 函数，拿到 虚拟节点树
        const subTree = instance.render.call(proxy);
        instance.subTree = subTree;

        // 调用 patch 处理 节点树
        patch(null, subTree, container, instance, anchor);

        // 在 patch 中真实生成了 真实dom 后，挂载到 vnode 上

        initialVNode.el = subTree.el;

        instance.isMounted = true;
      } else {
        //更新
        const { proxy } = instance;
        const currentSubTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        instance.subTree = currentSubTree;

        patch(prevSubTree, currentSubTree, container, instance, anchor);
        // initialVNode.el = currentSubTree.el;
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
