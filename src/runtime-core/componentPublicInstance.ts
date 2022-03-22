const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el,
};

export const PublicInstanceProxyHandlers = {
  get({ _instance }, key) {
    const { setupState } = _instance;
    if (key in setupState) {
      return setupState[key];
    }

    

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(_instance);
    }
  },
};
