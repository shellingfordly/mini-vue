import { generate } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { transformExpression } from "../src/transforms/transformExpression";
import { transformElement } from "../src/transforms/transformElement";

describe("codegen", () => {
  it("string", () => {
    const ast = baseParse("hi");

    transform(ast);

    const code = generate(ast);

    expect(code).toMatchSnapshot();
  });

  it("interpolation", () => {
    const ast = baseParse("{{message}}");

    transform(ast, {
      nodeTransform: [transformExpression],
    });

    const code = generate(ast);

    expect(code).toMatchSnapshot();
  });

  it("element", () => {
    const ast = baseParse("<div></div>");

    transform(ast, {
      nodeTransform: [transformElement],
    });

    const code = generate(ast);

    expect(code).toMatchSnapshot();
  });

  it("element + interpolation + string", () => {
    const ast = baseParse("<div>hi, {{message}}</div>");

    transform(ast, {
      nodeTransform: [transformElement, transformExpression],
    });

    const code = generate(ast);

    expect(code).toMatchSnapshot();
  });

  it("element > element", () => {
    const ast = baseParse("<div>hi, <span>{{message}}</span></div>");

    transform(ast, {
      nodeTransform: [transformElement, transformExpression],
    });

    const code = generate(ast);

    expect(code).toMatchSnapshot();
  });
});
