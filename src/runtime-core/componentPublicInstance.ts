const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el,
  $slots: (instance) => instance.slots,
  $props: (instance) => instance.props,
};

export const PublicInstanceProxyHandlers = {
  get({ _instance }, key) {
    const { setupState, props } = _instance;

    if (key in setupState) {
      return setupState[key];
    }

    if (key in props) {
      return props[key];
    }

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(_instance);
    }
  },
};
