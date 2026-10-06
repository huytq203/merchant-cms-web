const actionLabels: Record<string, string> = {
  INSERT: 'Tạo mới', UPDATE: 'Cập nhật', DELETE: 'Xóa', APPROVE: 'Phê duyệt',
  REJECT: 'Từ chối', LOCK: 'Khóa', UNLOCK: 'Mở khóa', TERMINATE: 'Chấm dứt',
  VIEW_DOCUMENT: 'Xem tài liệu', RESET_PASSWORD: 'Đặt lại mật khẩu',
  GRANT_PERMISSION: 'Cấp quyền', EXPORT: 'Xuất dữ liệu',
};

const entityLabels: Record<string, string> = {
  merchants: 'Hồ sơ merchant',
  sub_merchants: 'Sub-merchant',
  terminals: 'Terminal',
  merchant_orders: 'Đơn hàng',
  merchant_withdrawal_requests: 'Rút tiền',
  merchant_bank_accounts: 'Tài khoản ngân hàng',
};

/** Entities the BE returns to the portal; the filter offers exactly these. */
export const auditEntityOptions = Object.entries(entityLabels).map(([value, label]) => ({ value, label }));

export function actionLabel(action: string): string {
  return actionLabels[action] ?? action;
}

export function entityLabel(entity: string): string {
  return entityLabels[entity] ?? entity;
}
