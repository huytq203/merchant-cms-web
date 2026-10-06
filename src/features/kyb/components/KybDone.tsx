import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button/Button";

type Props = { onReview: () => void };

export function KybDone({ onReview }: Props) {
  return (
    <section className="grid place-items-center gap-3 py-6 text-center" role="status">
      <CheckCircle2 className="size-12 text-success" aria-hidden />
      <h3 className="text-lg font-semibold text-foreground">Đã gửi yêu cầu KYB thành công</h3>
      <p className="max-w-md text-sm text-muted-foreground">
        Hồ sơ đã chuyển sang trạng thái Chờ duyệt KYB. Quản trị viên sẽ thẩm định và phản hồi kết quả.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button
          variant="solid"
          nativeButton={false}
          render={<Link href="/dashboard" role="link" />}
        >
          Về Dashboard
        </Button>
        <Button type="button" variant="outline" onClick={onReview}>
          Xem lại hồ sơ
        </Button>
      </div>
    </section>
  );
}
