import { render } from "./renderer";
import { createVNode } from "./vnode";

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      // 将 跟组件rootComponent（vue组件）转化为虚拟节点 vnode
      const vnode = createVNode(rootComponent);

      // 调用渲染函数
      render(vnode, rootContainer);
    },
  };
}
