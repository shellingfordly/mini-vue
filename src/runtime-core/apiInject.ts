import { getCurrentInstance } from ".";

export function provide(key, value) {
  const currentInstance: any = getCurrentInstance();

  if (currentInstance) {
    if (
      currentInstance.parent &&
      // 解决多次调用 provide 时数据被覆盖问题
      currentInstance.provides === currentInstance.parent.provides
    ) {
      // 解决获取祖先组件数据问题
      currentInstance.provides = Object.create(currentInstance.parent.provides);
    }
    currentInstance.provides[key] = value;
  }
}

export function inject(key) {
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    return currentInstance.parent.provides[key];
  }
}
