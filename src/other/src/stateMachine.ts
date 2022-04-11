export function stateMachine(str: string) {
  let i = 0;
  let startIndex: number = 0;
  let endIndex: number = 0;
  let result: number[][] = [];

  const waitForA = (char) => {
    if (char === "a") {
      startIndex = i;
      return waitForB;
    }
    return waitForA;
  };

  const waitForB = (char) => {
    if (char === "b") {
      return waitForC;
    }
    return waitForB;
  };

  const waitForC = (char) => {
    if (char === "c") {
      endIndex = i;
      return end;
    }
    return waitForC;
  };

  const end = () => {
    return end;
  };

  let currentState = waitForA;
  for (i = 0; i < str.length; i++) {
    const nextState = currentState(str[i]);
    currentState = nextState;

    if (nextState === end) {
      result.push([startIndex, endIndex]);
      currentState = waitForA;
      // return true;
    }
  }

  console.log(result);
  

  return result;
  // return false;
}
