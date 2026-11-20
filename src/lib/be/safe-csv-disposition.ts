const SAFE_FILE = /^[A-Za-z0-9._-]{1,100}\.csv$/;

/**
 * Lọc lại tên file BE gửi trong Content-Disposition của các route xuất CSV: chỉ chữ/số/._- và đuôi .csv; tên có ".."
 * hay ký tự lạ (xuống dòng, đường dẫn) thì dùng tên mặc định `fallbackFile`. Dùng chung để các route xuất không lệch nhau.
 */
export function safeCsvDisposition(
  header: string | null | undefined,
  fallbackFile: string,
): string {
  const name = /filename="?([^";]+)"?/i.exec(header ?? "")?.[1]?.trim() ?? "";
  return `attachment; filename="${SAFE_FILE.test(name) && !name.includes("..") ? name : fallbackFile}"`;
}
