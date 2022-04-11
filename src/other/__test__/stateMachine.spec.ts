import { stateMachine } from "../src/stateMachine";

describe("stateMachine", () => {
  test.only("simple test", () => {
    const res = stateMachine("abc");
    expect(res).toStrictEqual([[0, 2]]);

    const res1 = stateMachine("xabcxxabc");
    expect(res1).toStrictEqual([
      [1, 3],
      [6, 8],
    ]);
  });
});
