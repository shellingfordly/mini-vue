export const isObject = (val) => {
  return val !== null && typeof val === "object";
};

export const hasChange = (obj, newObj) => !Object.is(obj, newObj);
