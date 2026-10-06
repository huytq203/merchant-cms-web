import { z } from "zod";

export const businessTypeSchema = z.enum(["ENTERPRISE", "HOUSEHOLD"]);

export const walletVerificationStatusSchema = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "VERIFIED",
  "REJECTED",
]);

/** Mirrors `EnterpriseWalletFieldRules` in the BE; the BE stays the final judge. */
const TAX_CODE_PATTERN = /^(?:[0-9-]{10}|[0-9-]{13})$/;
const PHONE_PATTERN = /^[0-9]{10,11}$/;
const MANAGER_ID_PATTERN = /^[0-9]{12}$/;

const optionalText = (max: number) => z.string().trim().max(max).optional();
const requiredText = (max: number, message: string) => z
  .string()
  .trim()
  .min(1, message)
  .max(max, `Tối đa ${max} ký tự`);
const stagingId = z.uuid().optional();

function isFutureDate(value: string) {
  return value > new Date().toISOString().slice(0, 10);
}

export const kybStepSchemas = {
  legal: z.object({
    registeredEmail: z.email("Email không đúng định dạng").max(100),
    legalName: requiredText(200, "Nhập tên pháp nhân"),
    taxCode: z.string().regex(TAX_CODE_PATTERN, "Mã số thuế gồm số và dấu gạch ngang, dài 10 hoặc 13 ký tự"),
    businessType: businessTypeSchema,
    headOfficeAddress: requiredText(500, "Nhập địa chỉ trụ sở"),
  }),
  representative: z.object({
    legalRepresentativeName: requiredText(100, "Nhập họ tên người đại diện"),
    legalRepresentativeIdNumber: requiredText(20, "Nhập số CCCD/Hộ chiếu người đại diện"),
    managerName: requiredText(100, "Nhập họ tên người quản lý ví"),
    managerTitle: requiredText(50, "Nhập chức vụ"),
    managerIdNumber: z.string().regex(MANAGER_ID_PATTERN, "Số CCCD người quản lý gồm đúng 12 chữ số"),
    managerIdExpiryDate: z.iso
      .date("Chọn ngày hết hạn")
      .refine(isFutureDate, "Giấy tờ đã hết hạn"),
    otpPhone: z.string().regex(PHONE_PATTERN, "Số điện thoại gồm 10-11 chữ số"),
  }),
  documents: z.object({
    businessLicenseStagingId: z.uuid(),
    idCardFrontStagingId: z.uuid(),
    idCardBackStagingId: z.uuid(),
    authorizationLetterStagingId: stagingId,
  }),
} as const;

export const walletDraftSchema = z.object({
  registeredEmail: optionalText(100),
  legalName: optionalText(200),
  taxCode: optionalText(20),
  businessType: businessTypeSchema.optional(),
  headOfficeAddress: optionalText(500),
  legalRepresentativeName: optionalText(100),
  legalRepresentativeIdNumber: optionalText(20),
  managerName: optionalText(100),
  managerTitle: optionalText(50),
  managerIdNumber: optionalText(12),
  managerIdExpiryDate: z.string().optional(),
  otpPhone: optionalText(11),
  businessLicenseStagingId: stagingId,
  idCardFrontStagingId: stagingId,
  idCardBackStagingId: stagingId,
  authorizationLetterStagingId: stagingId,
  internalWallet: z.boolean().optional(),
});

export const walletSubmitSchema = kybStepSchemas.legal
  .safeExtend(kybStepSchemas.representative.shape)
  .safeExtend(kybStepSchemas.documents.shape)
  .superRefine((value, context) => {
    const sameRepresentative = value.managerName.trim() === value.legalRepresentativeName.trim();
    if (sameRepresentative || value.authorizationLetterStagingId) return;
    context.addIssue({
      code: "custom",
      path: ["authorizationLetterStagingId"],
      message: "Cần giấy uỷ quyền khi người quản lý khác người đại diện",
    });
  });

/** Text fields of the wizard form (documents are tracked separately as staging ids). */
export const walletFormSchema = kybStepSchemas.legal.safeExtend(kybStepSchemas.representative.shape);

export const storedFileSchema = z.object({
  id: z.uuid(),
  filename: z.string().nullish(),
  contentType: z.string().nullish(),
  sizeBytes: z.number().nullish(),
  url: z.string().nullish(),
  urlExpiresAt: z.string().nullish(),
});

export const enterpriseWalletSchema = z.object({
  id: z.uuid(),
  registeredEmail: z.string(),
  verificationStatus: walletVerificationStatusSchema,
  bankLinkStatus: z.enum(["BANK_UNLINKED", "BANK_LINKED"]).nullish(),
  legalName: z.string().nullish(),
  taxCode: z.string().nullish(),
  businessType: businessTypeSchema.nullish(),
  headOfficeAddress: z.string().nullish(),
  legalRepresentativeName: z.string().nullish(),
  legalRepresentativeIdNumber: z.string().nullish(),
  managerName: z.string().nullish(),
  managerTitle: z.string().nullish(),
  managerIdNumber: z.string().nullish(),
  managerIdExpiryDate: z.string().nullish(),
  otpPhone: z.string().nullish(),
  internalWallet: z.boolean().optional(),
  kybRejectedReason: z.string().nullish(),
  kybRejectedAt: z.string().nullish(),
  kybRejectedBy: z.string().nullish(),
  businessLicense: storedFileSchema.nullish(),
  idCardFront: storedFileSchema.nullish(),
  idCardBack: storedFileSchema.nullish(),
  authorizationLetter: storedFileSchema.nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
});

export const walletAvailabilitySchema = z.object({
  emailAvailable: z.boolean(),
  taxCodeUsedBy: z.array(z.string()).optional(),
});

export const walletDocumentSchema = z.object({
  id: z.uuid().optional(),
  documentType: z.string(),
  status: z.string(),
  originalFilename: z.string().nullish(),
  contentType: z.string().nullish(),
  uploadedAt: z.string().nullish(),
  url: z.string().nullish(),
  urlExpiresAt: z.string().nullish(),
});

export const documentUploadSchema = z.object({ stagingId: z.uuid() });
