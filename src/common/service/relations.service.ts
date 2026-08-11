import { RelationsDto } from '../dto/relations.dto';

const isNumber = (value: any): boolean => {
  const num = parseFloat(value);
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