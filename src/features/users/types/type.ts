export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  permissionGroupId: string;
  permissionGroupName: string;
  subMerchantScope: "all" | "specific";
  assignedSubMerchantsIds: string[];
  assignedSubMerchantCount: number;
  createdAt: string;
  status: string;
  lockReason?: string;
  lockedAt?: string;
}
export interface UserListResponse {
  data: User[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}
