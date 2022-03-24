import { cameline, toHandlerKey } from "../shared";

export function emit(instance, event, ...args) {
  const handler = instance.props[toHandlerKey(cameline(event))];

  handler && handler(...args);
}
