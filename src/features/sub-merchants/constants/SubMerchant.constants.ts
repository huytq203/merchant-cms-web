import type { BadgeProps } from '@/components/ui/badge/Badge';
import type { SubMerchantStatus } from '../types';

export const SUB_MERCHANT_STATUS_OPTIONS: {
  value: SubMerchantStatus;
  label: string;
  variant: BadgeProps['variant'];
}[] = [
  { value: 'active',   label: 'Đang hoạt động', variant: 'soft-success' },
  { value: 'inactive', label: 'Ngừng hoạt động', variant: 'soft-warning' },
  { value: 'locked',   label: 'Đã khóa',         variant: 'soft-danger'  },
];

export const BUSINESS_TYPE_OPTIONS = [
  { label: 'Business Retail',  value: 'Business Retail' },
  { label: 'F&B Service',      value: 'F&B Service'     },
  { label: 'Grocery',          value: 'Grocery'         },
  { label: 'Healthcare',       value: 'Healthcare'      },
  { label: 'Electronics',      value: 'Electronics'     },
  { label: 'Education',        value: 'Education'       },
  { label: 'Entertainment',    value: 'Entertainment'   },
  { label: 'Other',            value: 'Other'           },
];

export const BANK_OPTIONS = [
  { label: 'Vietcombank',  value: 'Vietcombank'  },
  { label: 'Techcombank',  value: 'Techcombank'  },
  { label: 'BIDV',         value: 'BIDV'         },
  { label: 'VietinBank',   value: 'VietinBank'   },
  { label: 'Agribank',     value: 'Agribank'     },
  { label: 'MB Bank',      value: 'MB Bank'      },
  { label: 'VPBank',       value: 'VPBank'       },
  { label: 'ACB',          value: 'ACB'          },
  { label: 'Sacombank',    value: 'Sacombank'    },
  { label: 'TPBank',       value: 'TPBank'       },
  { label: 'HDBank',       value: 'HDBank'       },
  { label: 'OCB',          value: 'OCB'          },
  { label: 'SHB',          value: 'SHB'          },
  { label: 'SeABank',      value: 'SeABank'      },
];
