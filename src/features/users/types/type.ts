export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  permissionGroupId: string;
  permissionGroupName: string;
  subMerchantScope: string;
  assignedSubMerchants: string[];
  assignedSubMerchantCount: number;
  createdAt: string;
  status: string;
}
export interface UserListResponse {
  data: User[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}
