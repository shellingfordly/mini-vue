## reactive

1. readonly 变量 isReadonly 判断为 false

直接把 readonlyGet 赋给了 readonlyHandlers

```ts
export const readonlyHandlers = {
  readonlyGet,
};
```

修正

```ts
export const readonlyHandlers = {
  get: readonlyGet,
};
```
