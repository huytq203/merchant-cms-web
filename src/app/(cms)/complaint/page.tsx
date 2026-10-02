import { Download } from "lucide-react";
import { Button } from "@/components/ui";
import ComplaintForm from "@/features/complaints/components/ComplaintForm";

export default function ComplaintPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý Khiếu nại</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Theo dõi và xử lý khiếu nại từ các nguồn
          </p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
          Tải Excel
        </Button>
      </div>
      <ComplaintForm />
    </div>
  );
}
