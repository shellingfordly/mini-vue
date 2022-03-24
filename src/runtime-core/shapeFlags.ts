export enum ShapeFlag {
  NUll = 0,
  ELEMENT = 1,
  STATEFUL_COMPONENT = 2, // 0010
  TEXT_CHILDREN = 4, // 0100
  ARRAY_CHILDREN = 8, // 1000
  SLOT_CHILDREN = 10, //10000
}

/**
 * @description 判断 vnode 类型
 * @param type 被判断的类型
 * @param shapeFlag 期望是的类型
 * @returns ShapeFlag
 */
export function is(type, shapeFlag): ShapeFlag {
  return type & shapeFlag;
}

export function isElement(shapeFlag): ShapeFlag {
  return shapeFlag & ShapeFlag.ELEMENT;
}

export function isCompoent(shapeFlag): ShapeFlag {
  return shapeFlag & ShapeFlag.STATEFUL_COMPONENT;
}

export function isTextChildren(shapeFlag): ShapeFlag {
  return shapeFlag & ShapeFlag.TEXT_CHILDREN;
}

export function isArrayChildren(shapeFlag): ShapeFlag {
  return shapeFlag & ShapeFlag.ARRAY_CHILDREN;
}
