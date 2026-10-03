export const CREATE_ONLY_METADATA = 'toolkit:create-only';

/**
 * Поле DTO, записываемое только при create. При update тихо вырезается
 * (CommonService.update), при create — проходит как обычное поле.
 * Ограничение привязано к конкретному DTO: то же поле остаётся доступным
 * для записи через другие контроллеры/DTO без этого декоратора.
 *
 * @example
 * class AnswerDto extends CommonDto {
 *   @DtoColumn('Выбор')
 *   @CreateOnly()
 *   choice: boolean;
 * }
 */
export function CreateOnly(): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    // Set живёт на конструкторе класса (без property-key) — иначе её не
    // перечислить через reflect-metadata API
    const ctor = (object as { constructor?: Function }).constructor;
    if (!ctor) return;
    const fields: Set<string> =
      Reflect.getOwnMetadata(CREATE_ONLY_METADATA, ctor) || new Set();
    fields.add(String(propertyName));
    Reflect.defineMetadata(CREATE_ONLY_METADATA, fields, ctor);
  };
}

/**
 * Имена create-only полей экземпляра DTO (с учётом наследования —
 * идём по цепочке прототипов).
 */
export function createOnlyFieldsOf(dto: object): string[] {
  if (!dto || typeof dto !== 'object') return [];
  const fields: string[] = [];
  let proto = Object.getPrototypeOf(dto);
  while (proto && proto !== Object.prototype) {
    const ctor = (proto as { constructor?: Function }).constructor;
    const set: Set<string> = ctor
      ? Reflect.getOwnMetadata(CREATE_ONLY_METADATA, ctor) || new Set()
      : new Set();
    for (const field of set) {
      if (!fields.includes(field)) fields.push(field);
    }
    proto = Object.getPrototypeOf(proto);
  }
  return fields;
}

/**
 * Вырезает create-only поля из entity, собранного из dto (update-путь).
 * Тихо: наличие декоратора — согласованное правило, а не ошибка клиента.
 */
export const stripCreateOnlyFields = (entity: any, dto: object): void => {
  if (!entity || !dto) return;
  for (const field of createOnlyFieldsOf(dto)) {
    delete entity[field];
  }
};
