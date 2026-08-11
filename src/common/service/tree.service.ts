export function treeToFlat(
  data: object | object[],
): Record<string, unknown> | Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.map((item) => flattenObject(item, {}));
  }
  return flattenObject(data, {});
}

function flattenObject(
  obj: Record<string, any>,
  target: Record<string, any>,
  parentKey = '',
): Record<string, any> {
  for (const key of Object.keys(obj)) {
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    const value = obj[key];

    if (value === null || typeof value !== 'object') {
      target[newKey] = value;
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item !== null && typeof item === 'object') {
          flattenObject(item, target, `${newKey}.${index}`);
        } else {
          target[`${newKey}.${index}`] = item;
        }
      });
    } else {
      flattenObject(value, target, newKey);
    }
  }

  return target;
}

export function flatToTree(
  data: Record<string, unknown> | Record<string, unknown>[],
): object | object[] {
  if (Array.isArray(data)) {
    return data.map((item) => unflattenObject(item));
  }
  return unflattenObject(data);
}

function unflattenObject(data: Record<string, unknown>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key of Object.keys(data)) {
    setDeepValue(result, key.split('.'), data[key]);
  }

  return result;
}

function setDeepValue(
  target: Record<string, any>,
  keys: string[],
  value: unknown,
): void {
  let current = target;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    const isNextArrayIndex = /^\d+$/.test(nextKey);

    if (current[key] === undefined || current[key] === null) {
      current[key] = isNextArrayIndex ? [] : {};
    }

    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}
