import { NodeTypes } from "./ast";
import {
  CREATE_ELEMENT_VNODE,
  helperMapName,
  TO_DISPLAY_STRING,
} from "./runtimeHelper";
import { isString } from "../../shared";

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
    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;
    case NodeTypes.COMPUND_EXPORESS:
      genCompundExpression(node, context);
      break;
    default:
      break;
  }
}

function genCompundExpression(
  node: any,
  context: { code: string; push(source: any): void; helper(key: any): string }
) {
  const { children } = node;
  const { push } = context;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
  }
}

function genText(
  node: any,
  context: { code: string; push(source: any): void; helper(key: any): string }
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

function genElement(
  node: any,
  context: { code: string; push(source: any): void; helper(key: any): string }
) {
  const { push, helper } = context;
  const { tag, props, children } = node;
  push(`${helper(CREATE_ELEMENT_VNODE)}(`);
  genNodeList(genNullable([tag, props]), context);
  genChildren(children, context);
  push(")");
}

function genChildren(children, context) {
  const { push } = context;
  const isMoreElement = !!children.find(
    (child) => child.type === NodeTypes.ELEMENT
  );
  push(", ");
  isMoreElement && push("[ ");
  children.length ? genNodeList(children, context) : push("null");
  isMoreElement && push("] ");
}

function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (isString(node)) {
      push(node);
    } else {
      let codegenNode = node;
      if (node.type === NodeTypes.ELEMENT) {
        codegenNode = node.codegenNode;
      }
      genNode(codegenNode, context);
    }

    if (i < nodes.length - 1) {
      push(", ");
    }
  }
}

function genNullable(args: any[]) {
  return args.map((arg) => arg || "null");
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
