/**
 * Клиентский IP для аудит-записей и гвардов.
 *
 * Всегда req.ip: он выражает решение о доверии к прокси (Express `trust proxy`,
 * bootstrap ставит его из TRUST_PROXY, по умолчанию 1 хоп — gateway nginx).
 * Парсить X-Forwarded-For вручную нельзя: клиент контролирует ЛЕВЫЙ элемент
 * (@supercharge/request-ip брал именно его → произвольная подмена IP в аудите),
 * а при прямом доступе (без прокси) подменяем весь заголовок целиком.
 */
export function getClientIp(request: any): string | undefined {
  return request?.ip || request?.socket?.remoteAddress || undefined;
}
