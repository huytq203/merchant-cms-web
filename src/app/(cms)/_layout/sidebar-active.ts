/** Mục menu đang active khi đường dẫn trùng href hoặc nằm dưới href. */
export function isPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
