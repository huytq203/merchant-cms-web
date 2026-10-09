import {
  isMerchantPermission,
  type MerchantPermission,
} from '@/features/auth/permissions';

export const PERMISSION_LABELS: Record<MerchantPermission, string> = {
  VIEW_TRANSACTION: 'Xem giao dịch',
  EXPORT_TRANSACTION: 'Xuất giao dịch',
  CREATE_REFUND: 'Tạo yêu cầu hoàn tiền',
  CANCEL_REFUND: 'Hủy yêu cầu hoàn tiền',
  APPROVE_REFUND: 'Duyệt hoàn tiền',
  VIEW_REFUND: 'Xem hoàn tiền',
  CREATE_DISPUTE: 'Tạo khiếu nại',
  REPLY_DISPUTE: 'Phản hồi khiếu nại',
  VIEW_DISPUTE: 'Xem khiếu nại',
  CREATE_ORDER: 'Tạo đơn hàng',
  CANCEL_ORDER: 'Hủy đơn hàng',
  VIEW_ORDER: 'Xem đơn hàng',
  CONFIRM_ORDER: 'Xác nhận đơn hàng',
  CREATE_WITHDRAWAL: 'Tạo yêu cầu rút tiền',
  VIEW_WITHDRAWAL: 'Xem yêu cầu rút tiền',
  EXPORT_WITHDRAWAL: 'Xuất yêu cầu rút tiền',
  VIEW_BALANCE: 'Xem số dư',
  EXPORT_BALANCE: 'Xuất số dư',
  VIEW_AUDIT_LOG: 'Xem nhật ký hệ thống',
  MANAGE_USER: 'Quản lý người dùng',
  MANAGE_SUB_MERCHANT: 'Quản lý Sub-merchant',
  MANAGE_PERMISSION_GROUP: 'Quản lý nhóm quyền',
  VIEW_WALLET: 'Xem ví',
  TOPUP_WALLET: 'Nạp tiền vào ví',
  WITHDRAW_WALLET: 'Rút tiền từ ví',
  TRANSFER_WALLET: 'Chuyển tiền từ ví',
  EXPORT_WALLET_STATEMENT: 'Xuất sao kê ví',
};

/** Falls back to the raw code when BE adds a permission the FE has no label for yet. */
export function permissionLabel(code: string): string {
  return isMerchantPermission(code) ? PERMISSION_LABELS[code] : code;
}
