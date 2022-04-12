import { NodeTypes } from "./ast";
import { helperMapName, TO_DISPLAY_STRING } from "./runtimeHelper";

export function generate(ast) {
  const context = createGenerateContext();
  const { push } = context;

  genFunctionPreamble(ast, context);

  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(", ");

  push("return ");
  push(`function ${functionName}(${signature}){`);
  push("return ");
  genNode(ast.codegenNode, context);
  push("}");

  return context.code;
}

function genNode(
  node: any,
  context: { code: string; push(source: any): void; helper(key: any): string }
) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    default:
      break;
  }
}

function genText(
  node: any,
  context: { code: string; push(source: any): void }
) {
  const { push } = context;
  push(`"${node.content}"`);
}

function genInterpolation(
  node: any,
  context: { code: string; push(source: any): void; helper(key: any): string }
) {
  const { push, helper } = context;

  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(")");
}

function genExpression(
  node: any,
  context: { code: string; push(source: any): void; helper(key: any): string }
) {
  const { push } = context;
  push(`${node.content}`);
}

function createGenerateContext() {
  const context = {
    code: "",
    push(source) {
      context.code += source;
    },
    helper(key) {
      return `_${helperMapName[key]}`;
    },
  };

  return context;
}
function genFunctionPreamble(
  ast: any,
  context: { code: string; push(source: any): void; helper(key: any): string }
) {
  const { push } = context;
  const VueBinging = "Vue";

  if (ast.helpers.length) {
    const aliasHelper = (s) => `${helperMapName[s]}: _${helperMapName[s]}`;
    push(
      `const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBinging}`
    );
    push("\n");
  }
}
