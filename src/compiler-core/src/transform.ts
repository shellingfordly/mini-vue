export function transform(root, options) {
  const context = createTransfromContext(root, options);

  traverseNode(root, context);
}

function traverseNode(node, context) {
  for (let i = 0; i < context.nodeTransform.length; i++) {
    const transform = context.nodeTransform[i];
    transform(node);
  }

  traverseChildren(node, context);
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
  return {
    root,
    nodeTransform: options.nodeTransform || [],
  };
}
