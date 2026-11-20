import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";
import { disbursementRequests } from "../disbursement-queries";
import { batchSubmitBodySchema } from "../schemas/disbursement.schema";
import { describeDisbursementError } from "../utils/disbursement-errors";
import { validateBatchFile } from "../utils/disbursement-mapper";
import type { BatchSummaryData, BatchValidateResult } from "../types/types";

/**
 * Chọn và tải file lô lên kiểm tra. File sai đuôi/dung lượng bị chặn ngay ở trình duyệt; lỗi từng dòng không chặn:
 * BE giữ phần hợp lệ làm lô nháp và trả file lỗi, người dùng xem tóm tắt rồi mới gửi.
 */
export function useBatchUpload(subId: string, onUploaded: (result: BatchValidateResult) => void) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setUploading] = useState(false);

  const choose = (files: File[]) => {
    const next = files[0] ?? null;
    setError(next ? validateBatchFile(next) : null);
    setFile(next);
  };

  /** Ô chọn file tự từ chối (quá dung lượng, thừa file) bằng câu tiếng Anh nên thay bằng câu tiếng Việt cố định. */
  const reject = () => {
    setFile(null);
    setError("File không hợp lệ: chỉ nhận một file CSV, tối đa 2MB");
  };

  const upload = async () => {
    if (!file || isUploading) return;
    const invalid = validateBatchFile(file);
    if (invalid) return setError(invalid);
    setUploading(true);
    setError(null);
    try {
      onUploaded(await disbursementRequests.validateBatch(subId, file));
    } catch (failure) {
      setError(describeDisbursementError(failure));
    } finally {
      setUploading(false);
    }
  };

  return { file, error, isUploading, choose, reject, upload, canUpload: Boolean(file) && !error && !isUploading };
}

/**
 * Gửi lô: xin OTP gắn lô + băm file (BE phát khi lô còn gửi được), nhập mã, gửi kèm phiên bản lô vừa xem. Gửi xong BE
 * chuyển lô sang SUBMITTING và gửi từng lệnh ở nền; màn hình theo dõi tiến độ bằng chi tiết lô.
 */
export function useBatchSubmit(batch: Pick<BatchSummaryData, "batchId" | "version">) {
  const client = useQueryClient();
  const [challenge, setChallenge] = useState<SensitiveOtpChallenge | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [isRequestingCode, setRequestingCode] = useState(false);
  const [isSending, setSending] = useState(false);

  const requestCode = async () => {
    setRequestingCode(true);
    setFailure(null);
    try {
      setChallenge(await disbursementRequests.batchOtpChallenge(batch.batchId));
    } catch (error) {
      setFailure(describeDisbursementError(error));
    } finally {
      setRequestingCode(false);
    }
  };

  const submit = async (otp: string) => {
    if (!challenge || isSending) return;
    const body = batchSubmitBodySchema.safeParse({
      expectedVersion: batch.version,
      sensitiveOtp: { otpSessionId: challenge.otpSessionId, otp },
    });
    if (!body.success) return setFailure(body.error.issues[0]?.message ?? "Mã OTP không hợp lệ");
    setSending(true);
    setFailure(null);
    try {
      await disbursementRequests.submitBatch(batch.batchId, body.data);
      // Tải lại lô trước rồi mới tắt bước OTP: tránh nút "Gửi lô" hiện lại thoáng qua với dữ liệu nháp cũ.
      await client.invalidateQueries({ queryKey: ["disbursements"] });
      setChallenge(null);
    } catch (error) {
      setFailure(describeDisbursementError(error));
      // Gửi lỗi (5xx/timeout/6325/1006) có thể vẫn đã chuyển lô sang đang gửi: lấy lại trạng thái thật của lô.
      await client.invalidateQueries({ queryKey: ["disbursements"] }).catch(() => undefined);
    } finally {
      setSending(false);
    }
  };

  const cancel = () => {
    setChallenge(null);
    setFailure(null);
  };

  return { challenge, failure, isRequestingCode, isSending, requestCode, submit, cancel };
}
