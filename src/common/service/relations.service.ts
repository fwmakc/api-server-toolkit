import { RelationsDto } from '../dto/relations.dto';

const isNumber = (value: unknown): boolean => {
  const num = parseFloat(String(value));
  return !isNaN(num) && isFinite(num);
};

const compare = (a, b, desc = false) => {
  if (a instanceof Date && b instanceof Date) {
    return desc ? b.getTime() - a.getTime() : a.getTime() - b.getTime();
  }
  if (isNumber(a) && isNumber(b)) {
    a = parseFloat(a);
    b = parseFloat(b);
    return desc ? b - a : a - b;
  }
  const aStr = a == null ? '' : String(a);
  const bStr = b == null ? '' : String(b);
  return desc
    ? bStr.toLowerCase().localeCompare(aStr.toLowerCase())
    : aStr.toLowerCase().localeCompare(bStr.toLowerCase());
};

export const relationsOrder = (result, relations: Array<RelationsDto>) => {
  if (!relations || !Array.isArray(relations) || !relations.length) {
    return result;
  }

  result = result?.map((item) => {
    relations?.forEach(({ name, order, desc = false }) => {
      if (!name || !order) {
        return;
      }
      const keys = name.split('.');
      let currentLevel = item;

      keys.forEach((key, index) => {
        if (!currentLevel[key]) {
          return;
        }
        if (index === keys.length - 1 && Array.isArray(currentLevel[key])) {
          currentLevel[key] = currentLevel[key].sort((a, b) =>
            compare(a[order], b[order], desc),
          );
        }
        currentLevel = currentLevel[key];
      });
    });
    return item;
  });

  return result;
};
/**
 * typeorm 1.x removed the string[] form of FindOptionsRelations — relations
 * must be an object tree. The toolkit keeps the string[] public API
 * (FindDto.relations, EntityController whitelists, bind-generated names), so
 * this adapter sits at every repository.find/count boundary. Dot-paths
 * ('account.tenant') become nested nodes; typeorm 0.3 accepts the object
 * form too, so the same output serves both runtime majors.
 */
export const relationsToFindOptions = (
  relations: string[] | undefined | null,
): Record<string, any> | undefined => {
  if (!relations || relations.length === 0) {
    return undefined;
  }
  const tree: Record<string, any> = {};
  for (const relation of relations) {
    let node = tree;
    for (const part of relation.split('.')) {
      if (typeof node[part] !== 'object' || node[part] === null) {
        node[part] = {};
      }
      node = node[part];
    }
  }
  return tree;
};
