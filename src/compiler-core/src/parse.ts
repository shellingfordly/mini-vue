import { NodeTypes } from "./ast";

const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  const context = createParserContext(content);

  return createRoot(parseChildren(context, []));
}

function parseChildren(context, ancestars) {
  const nodes: any[] = [];

  while (!isEnd(context, ancestars)) {
    let node;
    const s = context.source;

    if (s.startsWith("{{")) {
      // 处理 插值
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      // 处理 标签
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestars);
      }
    }

    // 处理文本
    if (!node) {
      node = parseText(context);
    }

    nodes.push(node);
  }

  return nodes;
}

function isEnd(context, ancestars) {
  const s = context.source;

  if (s.startsWith("</")) {
    for (let i = 0; i < ancestars.length; i++) {
      const tag = ancestars[i];
      if (startsWithEndTagOpen(s, tag)) {
        return true;
      }
    }
  }

  return !s;
}

function parseText(context) {
  let endIndex = context.source.length;
  let endTokens = ["<", "{{"];

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);
  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function parseTextData(context, length) {
  const content = context.source.slice(0, length);

  advanceBy(context, length);

  return content;
}

// 解析 element
//   处理标签 <div></div>
function parseElement(context, ancestars) {
  const element: any = parseTag(context, TagType.Start);
  ancestars.push(element.tag);
  element.children = parseChildren(context, ancestars);
  ancestars.pop();

  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End);
  } else {
    throw new Error(`${element.tag}`);
  }

  return element;
}

function startsWithEndTagOpen(source, tag) {
  return (
    source.startsWith("</") &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
}

function parseTag(context, type: TagType) {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);

  const tag = match?.[1];
  // 处理完成的字符串 清除掉
  // 清除 <div
  advanceBy(context, match[0].length);
  // 清除 >
  advanceBy(context, 1);

  if (type === TagType.End) {
    return;
  }

  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
}

function parseInterpolation(context) {
  // {{ message }}

  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );
  advanceBy(context, openDelimiter.length);

  const rawContentLength = closeIndex - openDelimiter.length;

  const rawContent = context.source.slice(0, rawContentLength);
  const content = rawContent.trim();

  advanceBy(context, rawContentLength + closeDelimiter.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  };
}

function advanceBy(context, length: number) {
  context.source = context.source.slice(length);
}

function createRoot(children) {
  return {
    children,
    type: NodeTypes.ROOT,
  };
}

function createParserContext(content: string) {
  return {
    source: content,
  };
}
