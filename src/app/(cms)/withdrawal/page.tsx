import { ArrowUpFromLine, Download } from "lucide-react";
import { Button } from "@/components/ui";
import WithdrawalForm from "@/features/withdrawals/components/WithdrawalForm";

export default function WithdrawalPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lịch sử Rút Tiền</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý các yêu cầu rút tiền thủ công và quyết toán tự động T+1
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Xuất Excel
          </Button>
          <Button size="sm" leftIcon={<ArrowUpFromLine className="h-4 w-4" />}>
            Tạo yêu cầu rút tiền
          </Button>
        </div>
      </div>
      <WithdrawalForm />
    </div>
  );
}
