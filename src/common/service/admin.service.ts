const SUPERUSER_FIELD = process.env.SUPERUSER_FIELD || "isSuperuser";
const SUPERUSER_VALUES = (process.env.SUPERUSER_VALUE || "true")
  .split(",")
  .map((v) => v.trim());

export function isSuperuser(user: { isSuperuser?: boolean } | undefined | null): boolean {
  if (!user) return false;
  return SUPERUSER_VALUES.includes(String(user[SUPERUSER_FIELD]));
}
