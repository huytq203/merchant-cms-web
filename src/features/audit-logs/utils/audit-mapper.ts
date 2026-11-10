import type { AuditActorType, AuditCategory, AuditLog, AuditPeriod } from '../types';

const actionLabels: Record<string, string> = {
  INSERT: 'Tạo mới', UPDATE: 'Cập nhật', DELETE: 'Xóa', APPROVE: 'Phê duyệt',
  REJECT: 'Từ chối', LOCK: 'Khóa', UNLOCK: 'Mở khóa', TERMINATE: 'Chấm dứt',
  VIEW_DOCUMENT: 'Xem tài liệu', RESET_PASSWORD: 'Đặt lại mật khẩu',
  GRANT_PERMISSION: 'Gán nhóm quyền', EXPORT: 'Xuất dữ liệu',
};

/** Đối tượng cụ thể (entityName của BE) - hiện ở cột Đối tượng và trong chi tiết. */
const entityLabels: Record<string, string> = {
  merchants: 'Hồ sơ merchant',
  sub_merchants: 'Sub-merchant',
  terminals: 'Terminal',
  merchant_orders: 'Đơn hàng',
  merchant_withdrawal_requests: 'Lệnh rút tiền',
  merchant_bank_accounts: 'Tài khoản ngân hàng',
  MerchantUser: 'Người dùng',
  MerchantPermissionGroup: 'Nhóm quyền',
  merchant_revenue_refunds: 'Yêu cầu hoàn tiền',
  merchant_complaints: 'Khiếu nại',
  merchant_escrow_config_versions: 'Cấu hình ký quỹ',
  merchant_escrow_orders: 'Lệnh nộp ký quỹ',
  merchant_escrow_returns: 'Hoàn trả ký quỹ',
  merchant_escrow_payment_blocks: 'Chặn thanh toán do ký quỹ',
  merchant_revenue_freezes: 'Đóng băng doanh thu',
  merchant_settlement_configs: 'Cấu hình quyết toán',
  merchant_settlement_config_changes: 'Đề xuất đổi cấu hình quyết toán',
};

/** Nhóm (pill ở cột Nhóm và tùy chọn của bộ lọc Nhóm), đúng thứ tự BE khai báo. */
const categoryLabels: Record<AuditCategory, string> = {
  MERCHANT: 'Merchant',
  SUB_MERCHANT: 'Sub-merchant',
  TERMINAL: 'Terminal',
  ORDER: 'Đơn hàng',
  WITHDRAWAL: 'Rút tiền',
  BANK_ACCOUNT: 'Tài khoản ngân hàng',
  USER: 'Người dùng',
  PERMISSION_GROUP: 'Nhóm quyền',
  REFUND: 'Hoàn tiền',
  COMPLAINT: 'Khiếu nại',
  ESCROW: 'Ký quỹ',
  FREEZE: 'Đóng băng',
  CONFIG: 'Cấu hình',
};

const actorTypeLabels: Record<AuditActorType, string> = {
  MERCHANT: 'Người dùng merchant',
  FLEXPAY: 'FlexPay',
  SYSTEM: 'Hệ thống',
};

export const auditCategoryOptions = Object.entries(categoryLabels).map(([value, label]) => ({ value, label }));
export const auditActorTypeOptions = Object.entries(actorTypeLabels).map(([value, label]) => ({ value, label }));

/** Hành động portal thấy được (bỏ Xem tài liệu và Xuất dữ liệu - BE không trả hai loại chỉ đọc này). */
export const auditActionOptions = Object.entries(actionLabels)
  .filter(([value]) => value !== 'VIEW_DOCUMENT' && value !== 'EXPORT')
  .map(([value, label]) => ({ value, label }));

export const auditPeriodOptions: { value: AuditPeriod; label: string }[] = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: 'custom', label: 'Tùy chỉnh' },
];

export function actionLabel(action: string): string {
  return actionLabels[action] ?? action;
}

export function entityLabel(entity: string): string {
  return entityLabels[entity] ?? entity;
}

export function categoryLabel(category: AuditCategory | null | undefined): string {
  return category ? categoryLabels[category] : 'Khác';
}

/** Tên người thực hiện: BE mới gửi actorDisplayName, BE cũ chỉ có actorLabel. */
export function actorName(log: Pick<AuditLog, 'actorDisplayName' | 'actorLabel'>): string {
  return log.actorDisplayName ?? log.actorLabel;
}
