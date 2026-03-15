import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

type ParamDecoratorFactory<TData, TResult> = (data: TData, ctx: ExecutionContext) => TResult;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function getParamDecoratorFactory<TData, TResult>(decorator: Function): ParamDecoratorFactory<TData, TResult> {
  class TestClass {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    testFn(@decorator() _value: unknown): void {
      // noop
    }
  }

  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestClass, 'testFn') as Record<
    string,
    { factory: ParamDecoratorFactory<TData, TResult> }
  >;
  const [argKey] = Object.keys(args);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return args[argKey!]!.factory;
}
