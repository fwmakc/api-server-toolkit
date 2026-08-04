export const escapeQuotes = (string) => {
  return `${string || ''}`.replace(/'/gu, "''");
};

export const escapeIdentifier = (string) => {
  return `${string || ''}`.replace(/"/gu, '""');
};
