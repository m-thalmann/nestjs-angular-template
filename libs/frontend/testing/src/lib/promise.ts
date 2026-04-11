// eslint-disable-next-line @typescript-eslint/no-magic-numbers, @typescript-eslint/promise-function-async
export function promiseTimesOut(promise: Promise<unknown>, timeoutMs: number = 500): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(true), timeoutMs);

    promise.then(
      () => {
        clearTimeout(timeout);
        resolve(false);
      },
      () => {
        clearTimeout(timeout);
        resolve(false);
      },
    );
  });
}
