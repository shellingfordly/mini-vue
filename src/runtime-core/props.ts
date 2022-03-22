export function initProps(instance) {
  if (instance.setupState) {
    Object.keys(instance.setupState).forEach((key) => {
      instance[key] = instance.setupState[key];
    });
  }
}
