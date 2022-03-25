import { createVNode } from "./vnode";

export function createAppAPI(render) {
  
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        // 将 跟组件rootComponent（vue组件）转化为虚拟节点 vnode
        const vnode = createVNode(rootComponent);

        // 调用渲染函数
        render(vnode, rootContainer, null);
      },
    };
  };
}
