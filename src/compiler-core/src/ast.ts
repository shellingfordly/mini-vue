import { CREATE_ELEMENT_VNODE } from "./runtimeHelper";

export const enum NodeTypes {
  INTERPOLATION,
  SIMPLE_EXPRESSION,
  ELEMENT,
  TEXT,
  ROOT,
  COMPUND_EXPORESS,
}

export function createVNodeCall(context, tag, props, children) {
  context.helper(CREATE_ELEMENT_VNODE);

  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children,
  };
}
