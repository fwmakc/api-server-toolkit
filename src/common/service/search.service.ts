import { And, FindOperator, FindOptionsWhere, ILike } from 'typeorm';
import { SearchType } from '../type/search.type';

export const buildSearchWhere = (
  search: SearchType,
): FindOptionsWhere<any>[] => {
  const { fields, terms, method } = search;
  const isOr = `${method || ''}`.toLowerCase() === 'or';

  const buildNested = (path: string[], value: unknown): Record<string, unknown> => {
    if (path.length === 0) return value as Record<string, unknown>;
    return { [path[0]]: buildNested(path.slice(1), value) };
  };

  if (isOr) {
    return terms.flatMap((term) =>
      fields.map((field) =>
        buildNested(field.split('.'), ILike(`%${term.toLowerCase()}%`)),
      ),
    );
  }

  const fieldParts = fields.map((f) => f.split('.'));
  let combinations: Record<string, unknown>[] = [{} as Record<string, unknown>];
  for (const term of terms) {
    const next: Record<string, unknown>[] = [];
    for (const combo of combinations) {
      for (const parts of fieldParts) {
        const cond = buildNested(parts, ILike(`%${term.toLowerCase()}%`));
        next.push(deepMergeWhere(combo, cond));
      }
    }
    combinations = next;
  }
  return combinations;
};

export const mergeSearchWhere = (
  baseWhere: any,
  searchWhere: any[],
): any => {
  if (!searchWhere || searchWhere.length === 0) return baseWhere;

  const hasBase = baseWhere && Object.keys(baseWhere).length > 0;
  if (!hasBase) {
    return searchWhere.length === 1 ? searchWhere[0] : searchWhere;
  }

  const merged = searchWhere.map((sw) => deepMergeWhere(baseWhere, sw));
  return merged.length === 1 ? merged[0] : merged;
};

const deepMergeWhere = (target: any, source: any): any => {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const tv = result[key];
    const sv = source[key];
    if (
      tv !== undefined &&
      typeof tv === 'object' &&
      typeof sv === 'object' &&
      !(tv instanceof FindOperator) &&
      !(sv instanceof FindOperator)
    ) {
      result[key] = deepMergeWhere(tv, sv);
    } else if (tv !== undefined) {
      result[key] = And(tv, sv);
    } else {
      result[key] = sv;
    }
  }
  return result;
};

export const searchService = (result, search: SearchType) => {
  const { fields, terms, method } = search;
  const and = `${method || ''}` !== 'or';

  const text = extractValues(result, fields)?.toLowerCase();
  if (and) {
    return terms.every((term) => textIncludes(text, term));
  }
  return terms.some((term) => textIncludes(text, term));
};

const extractValues = (obj, keys) => {
  return keys
    .map((key) => {
      const path = key.split('.');
      return path.reduce(
        (acc, part) => (acc && acc[part] !== undefined ? acc[part] : null),
        obj,
      );
    })
    .filter((value) => value !== null)
    .join(' ');
};

const textIncludes = (text, term) => {
  return text.includes(term.toLowerCase());
};
