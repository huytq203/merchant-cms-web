export enum MerchantType {
    INDIVIDUAL = 'individual',
    HOUSEHOLD = 'household',
    BUSINESS = 'business',
}
export const MERCHANT_TYPE_OPTIONS = [
    { value: MerchantType.INDIVIDUAL, label: 'Cá nhân' , variant: 'soft-primary' },
    { value: MerchantType.HOUSEHOLD, label: 'Hộ kinh doanh' , variant: 'soft-success' },
    { value: MerchantType.BUSINESS, label: 'Doanh nghiệp' , variant: 'soft-warning' },
] as const;

export enum MerchantStatus {
    ACTIVE = 'active',
    PENDING = 'pending',
    LOCKED = 'locked',
    INACTIVE = 'inactive',
    INCOMPLETE = 'incomplete',
}       

export const MERCHANT_STATUS_OPTIONS = [
    { value: MerchantStatus.ACTIVE, label: 'Hoạt động' , variant: 'soft-success' },
    { value: MerchantStatus.PENDING, label: 'Chờ duyệt' , variant: 'soft-warning' },
    { value: MerchantStatus.LOCKED, label: 'Khóa' , variant: 'soft-danger' },
    { value: MerchantStatus.INACTIVE, label: 'Không hoạt động' , variant: 'soft-primary' },
    { value: MerchantStatus.INCOMPLETE, label: 'Chưa hoàn thiện' , variant: 'text-danger' },
] as const;
