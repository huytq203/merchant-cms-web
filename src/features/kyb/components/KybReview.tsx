import { DetailRow } from "./DetailRow";
import { maskIdNumber } from "../utils/kyb-mapper";
import type { WalletFormValues } from "../types";

const BUSINESS_TYPE_LABEL: Record<WalletFormValues["businessType"], string> = {
  ENTERPRISE: "Doanh nghiệp",
  HOUSEHOLD: "Hộ kinh doanh",
};

type Props = { values: WalletFormValues };

/** Read-only summary shown before the dossier is sent; ID numbers stay masked. */
export function KybReview({ values }: Props) {
  return (
    <section className="grid gap-4" aria-labelledby="kyb-review-title">
      <div className="grid gap-1">
        <h3 id="kyb-review-title" className="text-base font-semibold text-foreground">
          Xác nhận thông tin hồ sơ
        </h3>
        <p className="text-sm text-muted-foreground">
          Kiểm tra lại thông tin trước khi gửi. Sau khi gửi, hồ sơ chuyển sang trạng thái chờ duyệt và không thể chỉnh sửa.
        </p>
      </div>
      <dl className="grid grid-cols-1 gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
        <DetailRow label="Loại hình" value={BUSINESS_TYPE_LABEL[values.businessType]} />
        <DetailRow label="Email đăng ký" value={values.registeredEmail} />
        <DetailRow label="Tên pháp nhân" value={values.legalName} />
        <DetailRow label="Mã số thuế" value={values.taxCode} />
        <DetailRow label="Địa chỉ trụ sở" value={values.headOfficeAddress} />
        <DetailRow label="Người đại diện pháp luật" value={values.legalRepresentativeName} />
        <DetailRow label="CCCD người đại diện" value={maskIdNumber(values.legalRepresentativeIdNumber)} />
        <DetailRow label="Người quản lý ví" value={`${values.managerName} - ${values.managerTitle}`} />
        <DetailRow label="CCCD người quản lý" value={maskIdNumber(values.managerIdNumber)} />
        <DetailRow label="Ngày hết hạn giấy tờ" value={values.managerIdExpiryDate} />
        <DetailRow label="Số điện thoại nhận OTP" value={values.otpPhone} />
      </dl>
    </section>
  );
}
