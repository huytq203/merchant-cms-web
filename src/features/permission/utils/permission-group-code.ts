const MAX_CODE_LENGTH = 50;
/** Mirrors the backend rule (`validateCode` in MerchantPermissionGroupServiceImpl). */
const GROUP_CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,49}$/;
const DUPLICATE_MESSAGE_PATTERN = /already exists|đã tồn tại|trùng/i;

/** Derives the technical group code from the display name: no diacritics, upper-case, `_` separated. */
export function toPermissionGroupCode(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug.slice(0, MAX_CODE_LENGTH).replace(/_+$/g, '');
}

export function isValidGroupCode(code: string): boolean {
  return GROUP_CODE_PATTERN.test(code);
}

/** The BE answers a taken code with a free-text message; this is the only signal the proxy forwards. */
export function isDuplicateGroupCodeError(message: string | undefined): boolean {
  return message !== undefined && DUPLICATE_MESSAGE_PATTERN.test(message);
}
