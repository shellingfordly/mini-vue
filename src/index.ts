export * from "./runtime-dom";
export * from "./reactivity/src";

import { baseCompile } from "./compiler-core/src/compile";
import * as runtimeDom from "./runtime-dom";
import { registerRuntiomCompiler } from "./runtime-dom";

export function compileToFunction(template) {
  const code = baseCompile(template);
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}

registerRuntiomCompiler(compileToFunction);
