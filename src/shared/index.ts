enum Type {
  Object = "Object",
  Array = "Array",
  String = "String",
  Function = "Function",
}

export const EMPTY_OBJ ={}

const toString = Object.prototype.toString;

function is(val, type) {
  return toString.call(val) === `[object ${type}]`;
}

export const isObjectOrArray = (val) => isObject(val) || isArray(val);

export const isObject = (val) => is(val, Type.Object);

export const isArray = (val) => is(val, Type.Array);

export const isString = (val) => is(val, Type.String);

export const isFunction = (val) => is(val, Type.Function);

export const isUndefined = (val) => val === undefined;

export const isNull = (val) => val === null;

export const isNullOrUndefined = (val) => isUndefined(val) || isNull(val);

export const hasChange = (obj, newObj) => !Object.is(obj, newObj);

/**
 * @description 短横线命名法 转 驼峰命名法
 * @param str
 * @returns
 */
export const cameline = (str: string) => {
  return str.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
};

/**
 * @description 首字母大写
 * @param str
 * @returns
 */
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * @description 处理 on 事件名
 * @param str
 * @returns
 */
export const toHandlerKey = (str: string) => {
  return `on${capitalize(str)}`;
};
