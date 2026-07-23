export const escapeQuotes = (string) => {
  return `${string || ''}`.replace(/'/gu, "''");
};
