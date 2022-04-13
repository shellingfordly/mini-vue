import { createVNodeCall, NodeTypes } from "../ast";

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const vnodeTag = `"${node.tag}"`;
      const vnodeProps = node.props;
      const vnodeChildren = node.children;

      node.codegenNode = createVNodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren
      );
    };
  }
}
