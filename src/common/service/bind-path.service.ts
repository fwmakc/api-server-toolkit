export function buildNestedWhere(
  name: string,
  key: string,
  value: any,
): Record<string, any> {
  const bindValue = { [key]: value };
  if (!name || !name.includes('.')) {
    return { [name || 'account']: bindValue };
  }
  const segments = name.split('.');
  let nested: any = bindValue;
  for (let i = segments.length - 1; i >= 0; i--) {
    nested = { [segments[i]]: nested };
  }
  return nested;
}
