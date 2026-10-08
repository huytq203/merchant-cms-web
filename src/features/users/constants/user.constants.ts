import type { MerchantUserStatus, ScopeProposal } from "../schemas/user.schema";

export const userStatusLabels: Record<MerchantUserStatus, string> = {
  PENDING: "Chờ kích hoạt",
  ACTIVE: "Đang hoạt động",
  LOCKED: "Đã khóa",
};

export const userStatusOptions = (Object.keys(userStatusLabels) as MerchantUserStatus[]).map((value) => ({
  value,
  label: userStatusLabels[value],
}));

export const proposalStatusLabels: Record<ScopeProposal["status"], string> = {
  PENDING_APPROVAL: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

/** Session carries merchant ids only, so several merchants are told apart by position. */
export const singleMerchantLabel = "Merchant của bạn";
