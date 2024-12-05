export function buildDtoArray<TEntity, TDto>(
  entities: Array<TEntity>,
  buildFn: (entity: TEntity) => TDto,
): Array<TDto> {
  return entities.map((entity) => buildFn(entity));
}
