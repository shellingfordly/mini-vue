enum Type {
  Object = "Object",
  Array = "Array",
  String = "String",
}

const toString = Object.prototype.toString;

function is(val, type) {
  return toString.call(val) === `[object ${type}]`;
}

export const isObjectOrArray = (val) => isObject(val) || isArray(val);

export const isObject = (val) => is(val, Type.Object);

export const isArray = (val) => is(val, Type.Array);

export const isString = (val) => is(val, Type.String);

export const hasChange = (obj, newObj) => !Object.is(obj, newObj);
