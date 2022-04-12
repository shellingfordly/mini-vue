import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelper";

/**
 * @description transform
 *   将 basePardse 生成的ast树转换为方便 generate 方便去操作的节点树
 *   方便 generate 生成 render 函数
 * @param root
 * @param options
 */
export function transform(root, options = {}) {
  const context = createTransfromContext(root, options);

  traverseNode(root, context);

  createRootCodegen(root);

  root.helpers = [...context.helpers.keys()];
}

function traverseNode(node, context) {
  for (let i = 0; i < context.nodeTransform.length; i++) {
    const transform = context.nodeTransform[i];
    transform(node);
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;
    default:
      break;
  }
}

function traverseChildren(node: any, context: any) {
  const children = node.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      traverseNode(child, context);
    }
  }
}

function createTransfromContext(root: any, options: any) {
  const context = {
    root,
    nodeTransform: options.nodeTransform || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1);
    },
  };
  return context;
}

function createRootCodegen(root: any) {
  root.codegenNode = root.children[0].children[0];
}
