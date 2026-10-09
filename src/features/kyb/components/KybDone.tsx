import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button/Button";

type Props = { onContinue: () => void };

export function KybDone({ onContinue }: Props) {
  return (
    <section className="grid justify-items-center gap-3 py-8 text-center" role="status">
      <CheckCircle2 className="size-14 text-success" aria-hidden />
      <h3 className="text-lg font-semibold text-foreground">Đã gửi yêu cầu KYB</h3>
      <p className="max-w-md text-sm text-muted-foreground">
        Hồ sơ chuyển sang trạng thái Chờ duyệt KYB. Flexpay thường duyệt trong 1 đến 2 ngày làm việc và báo kết quả qua email.
      </p>
      <p className="text-sm text-muted-foreground">Trong thời gian chờ, hồ sơ chỉ xem, không sửa được.</p>
      <Button type="button" variant="solid" onClick={onContinue}>Xem trạng thái duyệt</Button>
    </section>
  );
}
