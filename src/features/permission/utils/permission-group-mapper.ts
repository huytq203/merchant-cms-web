import type { PermissionCatalogItem, PermissionGroupFormValues } from "../schemas/permission-group.schema";

const categoryLabels: Record<string, string> = {
  TRANSACTION: "Giao dịch",
  REFUND: "Hoàn tiền",
  DISPUTE: "Tranh chấp",
  ORDER: "Đơn hàng",
  FINANCE: "Tài chính",
  ADMINISTRATION: "Quản trị",
  WALLET: "Ví",
  APPROVAL: "Phê duyệt",
  SUB_MERCHANT_TERMINAL: "Điểm bán và Terminal",
  CONNECTION_PAYMENT: "Kết nối và thanh toán",
  FINANCIAL_TERMS: "Điều khoản tài chính",
  ESCROW_HOLD: "Ký quỹ và tạm giữ",
};

export function groupPermissionsByCategory(catalog: PermissionCatalogItem[]) {
  const groups: { category: string; label: string; permissions: PermissionCatalogItem[] }[] = [];
  for (const item of catalog) {
    const category = item.category in categoryLabels ? item.category : "OTHER";
    let group = groups.find((entry) => entry.category === category);
    if (!group) {
      group = { category, label: categoryLabels[category] ?? "Khác", permissions: [] };
      groups.push(group);
    }
    group.permissions.push(item);
  }
  return groups;
}

export function toGroupRequest(values: PermissionGroupFormValues, merchantId: string) {
  return {
    merchantId,
    code: values.code,
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    permissions: values.permissions,
  };
}

export function canEditGroup(group: { system: boolean }): boolean {
  return !group.system;
}
