import type { SubMerchantFormValues } from '../schemas';
import type { SubMerchantDetail } from '../types';

export type SubMerchantSubmitValues =
  Omit<SubMerchantFormValues, 'phone' | 'address'> & { phone?: string; address?: string };

export const defaultFormValues: SubMerchantFormValues = {
  name: '',
  mccCode: '',
  contractStagingId: '',
  inheritPhone: true,
  phone: '',
  inheritAddress: true,
  address: '',
};

export function toFormValues(editTarget: SubMerchantDetail | null | undefined): SubMerchantFormValues {
  if (!editTarget) return defaultFormValues;
  return {
    name: editTarget.name,
    mccCode: editTarget.mccCode ?? '',
    contractStagingId: '',
    inheritPhone: editTarget.phone.inherited,
    phone: editTarget.phone.inherited ? '' : editTarget.phone.value ?? '',
    inheritAddress: editTarget.address.inherited,
    address: editTarget.address.inherited ? '' : editTarget.address.value ?? '',
  };
}

export function toSubmitValues(values: SubMerchantFormValues): SubMerchantSubmitValues {
  return {
    name: values.name,
    mccCode: values.mccCode,
    contractStagingId: values.contractStagingId,
    inheritPhone: values.inheritPhone,
    ...(values.inheritPhone ? {} : { phone: values.phone }),
    inheritAddress: values.inheritAddress,
    ...(values.inheritAddress ? {} : { address: values.address }),
  };
}
