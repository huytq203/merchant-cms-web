"use client";

import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Notice } from "@/components/page/Notice";
import { Button } from "@/components/ui/button/Button";
import { FileUpload } from "@/components/ui/file-upload/FileUpload";
import { useBatchUpload } from "../hooks/use-disbursement-batch";
import { BATCH_MAX_BYTES, BATCH_TEMPLATE_URL } from "../utils/disbursement-mapper";

/**
 * Chi theo lô: tải file mẫu, điền, tải lên (CSV, tối đa 2MB, 1–1.000 dòng). BE giữ phần hợp lệ làm lô nháp rồi người
 * dùng sang màn tóm tắt để xem lỗi và gửi (cần OTP); mỗi lệnh con được kiểm hạn mức/giữ chỗ riêng khi gửi.
 */
export function BatchUpload({ subId }: { subId: string }) {
  const router = useRouter();
  const upload = useBatchUpload(subId, (result) => router.push(`/disbursements/batches/${result.batchId}`));
  return (
    <div className="space-y-4">
      <Notice tone="info">
        Tối đa 1.000 dòng mỗi file. Hệ thống chỉ gửi các dòng hợp lệ và trả file lỗi cho các dòng còn lại.
      </Notice>
      <a
        href={BATCH_TEMPLATE_URL}
        download
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <Download className="size-4" aria-hidden />
        Tải file mẫu (CSV)
      </a>
      <FileUpload
        label="File lô chi hộ"
        description="Chỉ nhận file .csv, tối đa 2MB"
        accept=".csv,text/csv"
        maxSize={BATCH_MAX_BYTES}
        maxFiles={1}
        value={upload.file ? [upload.file] : []}
        onChange={upload.choose}
        onError={upload.reject}
        error={upload.error ?? undefined}
        showPreview={false}
      />
      <div className="flex justify-end">
        <Button type="button" variant="solid" disabled={!upload.canUpload} isLoading={upload.isUploading} onClick={() => void upload.upload()}>
          Kiểm tra file
        </Button>
      </div>
    </div>
  );
}
