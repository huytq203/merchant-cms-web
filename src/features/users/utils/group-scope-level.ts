import type { AssignableGroup } from "../schemas/user.schema";

/**
 * Phạm vi mà các nhóm đã chọn đòi hỏi (chốt 11/11, BE `PermissionGroupScopeRule`):
 * - `MASTER`: toàn bộ Merchant, không chọn sub-merchant;
 * - `SUB`: chỉ các sub-merchant được chọn, bắt buộc ít nhất một;
 * - `MIXED`: trộn hai cấp, BE từ chối;
 * - `PENDING`: các nhóm đã có cấp nhưng người dùng chưa chọn nhóm nào;
 * - `null`: BE chưa trả cấp (trước V99), giữ cách chọn phạm vi cũ.
 */
export type SelectedScopeLevel = "MASTER" | "SUB" | "MIXED" | "PENDING" | null;

export const MIXED_LEVEL_MESSAGE = "Không thể chọn cùng lúc nhóm cấp Master và nhóm cấp Sub";

export function selectedScopeLevel(groupIds: readonly string[], groups: readonly AssignableGroup[]): SelectedScopeLevel {
  if (!groups.some((group) => group.scopeLevel)) return null;
  const chosen = groups.filter((group) => groupIds.includes(group.id));
  if (chosen.length === 0) return "PENDING";
  // Nhóm thiếu cấp được BE coi là cấp Master.
  const levels = new Set(chosen.map((group) => group.scopeLevel ?? "MASTER"));
  if (levels.size > 1) return "MIXED";
  return levels.has("SUB") ? "SUB" : "MASTER";
}

export function groupLevelLabel(level: AssignableGroup["scopeLevel"]): string | null {
  if (level === "SUB") return "Cấp Sub";
  return level === "MASTER" ? "Cấp Master" : null;
}
