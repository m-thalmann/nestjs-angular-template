import { ExecutionContext, PipeTransform, Type } from '@nestjs/common';
import { PARAMTYPES_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { ModuleRef } from '@nestjs/core';
import { isUndefined } from '@shared/common';

export async function executeParamDecorator<TParam = unknown>(
  decorator: ParameterDecorator,
  options: { executionContext: ExecutionContext; paramType?: Type<TParam>; moduleRef?: ModuleRef },
): Promise<TParam> {
  const { executionContext, paramType = Object, moduleRef } = options;

  class TestClass {
    testMethod(_param: TParam): void {
      // noop
    }
  }

  Reflect.defineMetadata(PARAMTYPES_METADATA, [paramType], TestClass.prototype, 'testMethod');
  decorator(TestClass.prototype, 'testMethod', 0);

  const argsMetadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestClass, 'testMethod') as Record<
    string,
    {
      factory: (data: unknown, ctx: ExecutionContext) => unknown;
      data: unknown;
      pipes: Array<PipeTransform | Type<PipeTransform>>;
    }
  >;

  const meta = Object.values(argsMetadata)[0];
  if (isUndefined(meta)) {
    throw new Error('No route argument metadata found for the decorated parameter');
  }

  let result = meta.factory(meta.data, executionContext);

  for (const pipeOrClass of meta.pipes) {
    // eslint-disable-next-line @typescript-eslint/init-declarations
    let pipe: PipeTransform;

    if (typeof pipeOrClass === 'function') {
      if (isUndefined(moduleRef)) {
        throw new Error(`The moduleRef must be provided to instantiate pipe of type ${pipeOrClass.name}.`);
      }

      // try to get pre-instantiated pipe from the moduleRef, otherwise create a new instance
      try {
        pipe = moduleRef.get(pipeOrClass, { strict: false });
      } catch {
        // eslint-disable-next-line no-await-in-loop
        pipe = await moduleRef.create(pipeOrClass);
      }
    } else {
      pipe = pipeOrClass;
    }

    // eslint-disable-next-line no-await-in-loop
    result = await pipe.transform(result as never, { type: 'custom', metatype: paramType });
  }

  return result as TParam;
}
