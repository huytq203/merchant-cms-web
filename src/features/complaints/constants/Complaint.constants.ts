import type { StatusTone } from '@/components/page/StatusBadge';
import type {
  Complaint,
  ComplaintParty,
  ComplaintReason,
  ComplaintRequestSource,
  ComplaintStatus,
  ComplaintVerdict,
} from '../types/types';

/** Status labels of the BE contract (handoff "Giá trị dùng chung"); used by the status filter. */
export const COMPLAINT_STATUS_OPTIONS: { value: ComplaintStatus; label: string; tone: StatusTone }[] = [
  { value: 'WAITING', label: 'Chờ tiếp nhận', tone: 'warning' },
  { value: 'PROCESSING', label: 'Đang xử lý', tone: 'info' },
  { value: 'CLOSED', label: 'Đã kết thúc', tone: 'neutral' },
  { value: 'CANCELLED', label: 'Đã hủy', tone: 'neutral' },
];

export const COMPLAINT_VERDICT_LABELS: Record<ComplaintVerdict, string> = {
  ACCEPTED: 'Chấp nhận',
  REJECTED: 'Từ chối',
};

/** "Chờ ai phản hồi" while a complaint is PROCESSING. */
export const COMPLAINT_WAITING_ON_OPTIONS: { value: ComplaintParty; label: string }[] = [
  { value: 'ADMIN', label: 'Chờ Admin' },
  { value: 'MERCHANT', label: 'Chờ Merchant' },
  { value: 'USER', label: 'Chờ User' },
];

/** Who sent a complaint, who wrote a message, who closed it. */
export const COMPLAINT_PARTY_LABELS: Record<ComplaintParty, string> = {
  ADMIN: 'Admin',
  MERCHANT: 'Merchant',
  USER: 'User',
};

export const COMPLAINT_REPORTER_OPTIONS: { value: ComplaintParty; label: string }[] = (
  ['ADMIN', 'MERCHANT', 'USER'] as const
).map((value) => ({ value, label: COMPLAINT_PARTY_LABELS[value] }));

/** "Nguồn yêu cầu" of a case the gateway opened. */
export const COMPLAINT_REQUEST_SOURCE_LABELS: Record<ComplaintRequestSource, string> = {
  BANK: 'Ngân hàng',
  AUTHORITY: 'Cơ quan chức năng',
  CARD_ORG: 'Tổ chức thẻ',
  INTERNAL: 'Nội bộ điều soát',
};

/** The seven reasons and their labels, as the BE enum `ComplaintReason` names them. */
export const COMPLAINT_REASON_OPTIONS: { value: ComplaintReason; label: string }[] = [
  { value: 'NOT_RECEIVED', label: 'Khách báo chưa nhận hàng' },
  { value: 'FRAUD', label: 'Nghi ngờ gian lận' },
  { value: 'WRONG_FEE', label: 'Tính phí nhầm' },
  { value: 'NOT_PROCESSED', label: 'Không được xử lý' },
  { value: 'DUPLICATE', label: 'Trùng lặp' },
  { value: 'AMOUNT_MISMATCH', label: 'Sai lệch số tiền' },
  { value: 'OTHER', label: 'Khác' },
];

/** Label of a stored reason; an unknown code is shown as is, like the BE `labelOf`. */
export function reasonLabel(code: string | null | undefined): string {
  if (!code) return '—';
  return COMPLAINT_REASON_OPTIONS.find((option) => option.value === code)?.label ?? code;
}

export function waitingOnLabel(party: ComplaintParty | null | undefined): string | null {
  return party ? (COMPLAINT_WAITING_ON_OPTIONS.find((option) => option.value === party)?.label ?? null) : null;
}

export type ComplaintStatusDisplay = { label: string; tone: StatusTone };

/**
 * One label for status and verdict: a closed complaint reads "Đã kết thúc – Chấp nhận/Từ chối".
 * A closed complaint without a verdict (not expected) reads only "Đã kết thúc".
 */
export function describeComplaintStatus(complaint: Pick<Complaint, 'status' | 'verdict'>): ComplaintStatusDisplay {
  const base = COMPLAINT_STATUS_OPTIONS.find((option) => option.value === complaint.status);
  if (complaint.status === 'CLOSED' && complaint.verdict) {
    return {
      label: `Đã kết thúc – ${COMPLAINT_VERDICT_LABELS[complaint.verdict]}`,
      tone: complaint.verdict === 'ACCEPTED' ? 'success' : 'danger',
    };
  }
  return { label: base?.label ?? complaint.status, tone: base?.tone ?? 'neutral' };
}

/** Evidence files the BE accepts (SRS 3.5.3 STT 7): .pdf/.jpg/.png, at most 10MB each, at most 10 per send. */
export const EVIDENCE_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
export const EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;
export const EVIDENCE_HINT = 'Định dạng .pdf, .jpg, .png · Mỗi tệp tối đa 10MB · Tối đa 10 tệp';
