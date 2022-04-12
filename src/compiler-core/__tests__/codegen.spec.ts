import { generate } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { transformExpression } from "../src/transforms/transformExpression";

describe("codegen", () => {
  it("string", () => {
    const ast = baseParse("<div>hi</div>");

    transform(ast);

    const code = generate(ast);

    expect(code).toMatchSnapshot();
  });

  it("interpolation", () => {
    const ast = baseParse("<div>{{message}}</div>");

    transform(ast, {
      nodeTransform: [transformExpression],
    });

    const code = generate(ast);

    expect(code).toMatchSnapshot();
  });
});
