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
import { EMPTY_OBJ } from "../shared";
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { queueJobs } from "./scheduler";

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
    } else {
      const s1 = i;
      const s2 = i;
      const toBePatched = e2 - s2 + 1;
      // 记录 c2 里面， 从 i - e2 的节点位置，方便后面判断 c1 中存在的老节点是 更新还是删除
      const keyToNewINdexMap = new Map();
      // c2 中新节点 在 老节点 c1 中的 位置索引 映射
      // 这个map是为了去做 老节点的位置更新的
      const newIndexToOldIndexMap = new Array(toBePatched).fill(-1);
      // 优化更新
      let moved = true;
      let maxNewIndexSoFar = 0;

      // 将不同的 新节点 的 {key: index} 保存起来
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        nextChild.key && keyToNewINdexMap.set(nextChild.key, i);
      }
      // 遍历 c1 中不同节点 部分 --- 删除 c1 中不存在的节点， patch 更新相同节点
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        // 已经做过更新的 节点数
        let patched = 0;

        // 当更新 过的节点数 已经 大于等于 新节点数量时，直接删除 c1 中剩余的所有节点
        // 前提都是 在 s1 - e1 这个索引范围内
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }

        // 是否存在 新节点的 索引
        let newIndex;

        // 有 key 值从 keyToNewINdexMap 中找
        if (prevChild.key !== null) {
          newIndex = keyToNewINdexMap.get(prevChild.key);
        } else {
          // 没有 key， 遍历 c2 找
          // 找到与 老节点 prevChild 相同的节点 返回
          for (let i = s2; i <= e2; i++) {
            if (isSomeVNodeType(prevChild, c2[i])) {
              newIndex = i;
              break;
            }
          }
        }

        if (newIndex === undefined) {
          // newIndex 新节点索引 不存在， 删除老节点
          hostRemove(prevChild.el);
        } else {
          // 新节点 存在 做更新
          /*
            0 1 2 3 4 5
            a b c d e f                            c: 2 d: 3 e: 4
                s1  e1
            a b e c d f                            e: 4 c: 2 d: 3
                s2  e2       newIndexToOldIndexMap[ -1, 2, 3]

                
            newIndex 是 老节点 在 新节点数组 中的 下标
              c节点 老下标为 2，新下标 3
              c: 2 - nexIndex: 3, s2: 2
              d: 3 - nexIndex: 4, s2: 2
              e: 4 - newIndex: 2, s2: 2

            在这个循环中，是循环老节点树，获取 此节点 在新节点树中的下标 位置，
            而做位置更新时使用了 最长递增数列 的算法优化，因此如果节点的 绝对位置 不变，则不需要做 移动
            
            maxNewIndexSoFar 去记录上一个找到的 newIndex
            如果下一个节点的 newIndex 比上一次的大，说明这个节点在新的节点树也是 在上一个节点 后面的，因此不需要移动

            如果下一个节点的 newIndex 比上一个的小，则说明此节点 在新节点树中发生了位置变化，需要移动，打开 moved开关
          
          */
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }

          // 通过 prevChild.key 找到 此节点在新节点树中的 位置下标（newIndex）
          // newIndex - s2 此时为 在不同节点 范围内，此节点在 新节点树中的 绝对位置
          // 将这个绝对位置的值设置为，此节点在 老节点树中的 下标 i
          // newIndexToOldIndexMap 就映射了 节点的新位置和老位置，下标为新位置，值为老位置
          // 因为从 newIndexToOldIndexMap 找到最长的递增数列，就是那些绝对位置没有变的节点，而剩下的就是需要改变的
          // 也正因如此，上面 可以同记录上一次的 newIndex 来判断是否需要 移动
          newIndexToOldIndexMap[newIndex - s2] = i;
          patch(prevChild, c2[newIndex], container, parentInstance, null);
          patched++;
        }
      }

      // 获取 老节点索引 的 最长递增子序列，不需要移动的节点的 相对位置 是不会变化的， 一定是低增的
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      let j = increasingNewIndexSequence.length - 1;

      /*
        a b (c d e) f  
        a b (e c d) f  
        为什么这里 只需要 for 改变节点范围的长度 toBePatched 去对比 increasingNewIndexSequence 最长地址数列就可以知道需不需要移动

        因为 increasingNewIndexSequence 数组代表的是 不需要移动的节点 在新节点树的下标值，因此在更新之后这个 下标的 对应的节点之间的 绝对位置是不变的；
        在 这个 更新节点 的个数范围里面，只需要找到那个在 increasingNewIndexSequence 不存的下标， 就是需要 移动的 节点 位置，
        而这个节点就是 c2中 [数量长度 加上 新节点不同 的起点 s2] 位置的节点
        
        而之所以 从最后一个节点位置 toBePatched 开始循环，是因为 在不同节点范围内的节点 的位置不稳定的；
        而 toBePatched + 1 位置的节点是稳定的，因为它要么是 尾部的相同节点， 要么超出了 节点树长度，就直接增加到 最后就行

      */

      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;

        if (moved) {
          if (i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor);
          } else {
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
    if (!n1) {
      mountComponent(n2, container, parentInstance, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }

  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      n2.el = n1.el;
    }
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
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentInstance
    ));

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
    instance.update = effect(
      () => {
        // 初始化
        if (!instance.isMounted) {
          const { proxy } = instance;
          // 执行 组件实例 上的 render 函数，拿到 虚拟节点树
          const subTree = instance.render.call(proxy, proxy);
          instance.subTree = subTree;

          // 调用 patch 处理 节点树
          patch(null, subTree, container, instance, anchor);

          // 在 patch 中真实生成了 真实dom 后，挂载到 vnode 上

          initialVNode.el = subTree.el;

          instance.isMounted = true;
        } else {
          //更新
          console.log("update");
          const { proxy, vnode, next } = instance;
          if (next) {
            next.el = vnode.el;
            updateComponentPreRender(instance, next);
          }
          const currentSubTree = instance.render.call(proxy, proxy);
          const prevSubTree = instance.subTree;
          instance.subTree = currentSubTree;

          patch(prevSubTree, currentSubTree, container, instance, anchor);
          // initialVNode.el = currentSubTree.el;
        }
      },
      {
        scheduler() {
          queueJobs(instance.update);
        },
      }
    );
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
        } else {
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
