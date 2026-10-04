import { Repository } from 'typeorm';

export interface CapacityColumns {
  /** Колонка-лимит, имя свойства сущности (default 'capacity'). */
  capacityColumn?: string;
  /** Колонка счётчика занятых, имя свойства сущности (default 'taken'). */
  takenColumn?: string;
}

/**
 * Атомарно занимает один слот в первой из строк-кандидатов, где есть место:
 * `UPDATE ... SET taken = taken + 1 WHERE id = :id AND taken < capacity RETURNING id`.
 * Условие проверяется под блокировкой строки — переполнение невозможно даже
 * под конкурентной записью (hot-row на наполняющемся кандидате — ожидаемо).
 * Кандидаты перебираются по порядку; подходит для «первый поток со свободными
 * местами» при автораспределении.
 *
 * Контракт claim-then-insert: UPDATE коммитится сразу, если repository не
 * привязан к открытой транзакции. Вызывающий, который занимает слот в одной
 * транзакции, а зависимую строку (подписку/бронь) вставляет в другой — течёт:
 * crash между шагами оставляет занятый слот без строки (taken > факта).
 * claimSlot и зависимая запись обязаны делить одну транзакцию — передавайте
 * repository от того же manager и вставляйте в той же транзакции.
 *
 * @param repository  Repository таблицы-кандидата (в т.ч. от manager — для транзакции)
 * @param candidateIds id-кандидаты в порядке предпочтения
 * @returns id строки, чей слот занят, или null — свободных мест нет
 */
export const claimSlot = async (
  repository: Repository<any>,
  candidateIds: Array<number | string>,
  columns: CapacityColumns = {},
): Promise<number | string | null> => {
  if (!candidateIds?.length) return null;

  const propName = columns.capacityColumn ? columns.capacityColumn : 'capacity';
  const takenProp = columns.takenColumn ? columns.takenColumn : 'taken';
  // set() ждёт имена свойств, where/raw-SQL — колонки БД: резолвим по метаданным
  const dbName = (prop: string) =>
    repository.metadata.findColumnWithPropertyPath(prop)?.databaseName || prop;
  const capacityDb = dbName(propName);
  const takenDb = dbName(takenProp);

  for (const id of candidateIds) {
    const result = await repository
      .createQueryBuilder()
      .update()
      .set({ [takenProp]: () => `"${takenDb}" + 1` })
      .where(`"${takenDb}" < "${capacityDb}" AND "id" = :id`, { id })
      .returning('id')
      .execute();
    if (result.raw?.length) return result.raw[0].id;
  }
  return null;
};
