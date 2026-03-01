export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends Array<infer R>
    ? ReadonlyArray<DeepReadonly<R>>
    : T[P] extends object
      ? DeepReadonly<T[P]>
      : T[P];
};
