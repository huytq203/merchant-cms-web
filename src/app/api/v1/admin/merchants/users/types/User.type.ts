export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  permissionGroupId: string;
  permissionGroupName?: string;
  subMerchantScope: "all" | "specific";
  assignedSubMerchantsIds: string[];
  assignedSubMerchantCount?: number;
  createdAt: string;
  updatedAt?: string;
  status: "active" | "inactive" | "locked";
  lockReason?: string;
  lockedAt?: string;
}
