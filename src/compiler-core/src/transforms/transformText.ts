import { NodeTypes } from "../ast";

export function transformText(node) {
  const isText = (node) =>
    node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION;

  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node;
      let currentContainer;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const nextChild = children[j];

            if (isText(nextChild)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPUND_EXPORESS,
                  children: [child],
                };
              }

              currentContainer.children.push(" + ");
              currentContainer.children.push(nextChild);
              children.splice(j, 1);
              j--;
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
    };
  }
}
