import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";
import { useOptionalSession } from "@/features/auth/components/session-provider";
import { disbursementRequests } from "../disbursement-queries";
import { disbursementFormSchema } from "../schemas/disbursement.schema";
import { describeDisbursementError, disbursementFailureKind, isOrderNotFound, isOutcomeUnknown } from "../utils/disbursement-errors";
import { createBlockReason, generateRequestCode, nameGateReason, parseAmountInput } from "../utils/disbursement-mapper";
import { clearUnconfirmedOrder, loadUnconfirmedOrder, saveUnconfirmedOrder, unconfirmedOrderKey } from "../utils/unconfirmed-order-store";
import type { DisbursementPreview, DisbursementView, NameInquiry } from "../types/types";

/** Giá trị đang gõ trên form; số tiền giữ dạng chuỗi để người dùng gõ dấu ngăn cách. */
export type DisbursementFields = {
  merchantRequestCode: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: string;
  description: string;
};

export type DisbursementStep = "form" | "review" | "otp" | "result";
export type DisbursementFieldErrors = Partial<Record<keyof DisbursementFields, string>>;

/**
 * Tra tên → xem trước → OTP → kết quả. Quy tắc chống chi hai lần: gặp 503 (6323), 5xx hay mất mạng lúc gửi thì lệnh CÓ
 * THỂ đã lưu, nên vào trạng thái "chưa xác nhận" BỀN: khoá mã yêu cầu + nội dung lệnh (BE idempotent theo Sub + mã YC,
 * đổi nội dung với cùng mã bị từ chối), gửi lại phải xin OTP mới (OTP dùng một lần) nhưng giữ nguyên mã. Trạng thái
 * này chỉ gỡ khi: gửi/tra lại ra lệnh, hoặc người dùng chủ động bỏ lệnh sau khi đã tra ("Tạo lệnh khác"). Tra lại
 * trả 404 "không có lệnh" cũng KHÔNG mở khoá (đường tạo có thể còn đang chạy ở BE): CẦN CHỐT. Lỗi 4xx khác (vd. OTP sai
 * 5732) KHÔNG làm mất trạng thái này. Trạng thái được lưu localStorage (không kèm OTP) để sống qua F5/đổi hình thức/đổi Sub.
 */
export function useDisbursementCreateFlow(subId: string) {
  const client = useQueryClient();
  const userId = useOptionalSession()?.userId ?? "anonymous";
  const storeKey = unconfirmedOrderKey(userId, subId);
  const [step, setStep] = useState<DisbursementStep>("form");
  // Mã sinh một lần khi mở form (CẦN CHỐT 11): useState nhận hàm khởi tạo nên không đổi sau mỗi lần render.
  const [values, setValues] = useState<DisbursementFields>(() => ({
    merchantRequestCode: generateRequestCode(),
    bankCode: "",
    accountNumber: "",
    accountName: "",
    amount: "",
    description: "",
  }));
  const [errors, setErrors] = useState<DisbursementFieldErrors>({});
  const [inquiry, setInquiry] = useState<NameInquiry | null>(null);
  const [mismatchAccepted, setMismatchAccepted] = useState(false);
  const [preview, setPreview] = useState<DisbursementPreview | null>(null);
  const [challenge, setChallenge] = useState<SensitiveOtpChallenge | null>(null);
  const [result, setResult] = useState<DisbursementView | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  // Đã thử tra lại lệnh ít nhất một lần: điều kiện để được chủ động bỏ lệnh chưa xác nhận.
  const [lookedUp, setLookedUp] = useState(false);
  const [busy, setBusy] = useState<"inquiry" | "preview" | "otp" | "send" | "lookup" | null>(null);
  // Khôi phục lệnh chưa xác nhận đã lưu (F5, đổi hình thức, đổi Sub rồi quay lại). Đọc trong effect, không đọc lúc render
  // đầu, để HTML server và client khớp nhau (server không có localStorage).
  useEffect(() => {
    const saved = loadUnconfirmedOrder(storeKey);
    if (!saved) return;
    // Đồng bộ từ hệ thống ngoài (localStorage) sau khi mount, nên cần setState trong effect.
    /* eslint-disable react-hooks/set-state-in-effect */
    setValues(saved.values);
    setInquiry(saved.inquiry);
    setMismatchAccepted(saved.mismatchAccepted);
    setOutcomeUnknown(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storeKey]);

  // Tab khác (đã mở sẵn) vừa ghi lệnh chưa xác nhận cho cùng user + Sub: khoá luôn tab này. Chỉ nghe khi tab này chưa có
  // lệnh chưa xác nhận của riêng nó (không ghi đè). Sự kiện xoá bản lưu bị bỏ qua có chủ ý: không tự mở khoá.
  useEffect(() => {
    if (outcomeUnknown) return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storeKey || !event.newValue) return;
      const saved = loadUnconfirmedOrder(storeKey);
      if (!saved) return;
      setValues(saved.values);
      setInquiry(saved.inquiry);
      setMismatchAccepted(saved.mismatchAccepted);
      setOutcomeUnknown(true);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storeKey, outcomeUnknown]);

  // Rời/tải lại trang khi chưa biết lệnh đã được tạo chưa, hoặc khi request gửi còn đang bay (kết quả cũng chưa rõ):
  // cảnh báo để người dùng không bỏ dở rồi tạo lệnh khác.
  const sendingNow = busy === "send";
  useEffect(() => {
    if (!outcomeUnknown && !sendingNow) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [outcomeUnknown, sendingNow]);

  // Chặn bấm đúp: một lần gửi đang bay thì lần bấm sau không tạo thêm yêu cầu.
  const sending = useRef(false);

  /** Đổi thông tin nào của người nhận/số tiền đều làm kết quả tra tên, xem trước và OTP đã xin hết giá trị. */
  const change = <K extends keyof DisbursementFields>(field: K, value: DisbursementFields[K]) => {
    // Đang chưa xác nhận lệnh trước: khoá mã YC và nội dung để lần gửi lại là đúng lệnh đó (không chi hai lần).
    if (outcomeUnknown) return;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (field === "bankCode" || field === "accountNumber" || field === "accountName") {
      setInquiry(null);
      setMismatchAccepted(false);
    }
    if (field !== "description") {
      setPreview(null);
      setChallenge(null);
    }
    setFailure(null);
  };

  const parsed = () => disbursementFormSchema.safeParse({
    subId,
    merchantRequestCode: values.merchantRequestCode,
    amount: parseAmountInput(values.amount),
    bankCode: values.bankCode,
    accountNumber: values.accountNumber,
    ...(values.accountName.trim() ? { accountName: values.accountName } : {}),
    ...(values.description.trim() ? { description: values.description } : {}),
  });

  const collectErrors = (issues: { path: PropertyKey[]; message: string }[]) => {
    const next: DisbursementFieldErrors = {};
    for (const issue of issues) {
      const key = String(issue.path[0]) as keyof DisbursementFields;
      if (key in values && !next[key]) next[key] = issue.message;
    }
    setErrors(next);
  };

  /** Tra tên chủ tài khoản nhận; cần ngân hàng + số tài khoản, tên khai báo là tuỳ chọn. */
  const inquire = async () => {
    if (outcomeUnknown) return;
    if (!values.bankCode || !values.accountNumber.trim()) {
      setErrors({
        ...(values.bankCode ? {} : { bankCode: "Vui lòng chọn ngân hàng nhận" }),
        ...(values.accountNumber.trim() ? {} : { accountNumber: "Vui lòng nhập số tài khoản nhận" }),
      });
      return;
    }
    setBusy("inquiry");
    setFailure(null);
    try {
      const declared = values.accountName.trim();
      setInquiry(await disbursementRequests.inquireName({
        subId,
        bankCode: values.bankCode.trim(),
        accountNumber: values.accountNumber.trim(),
        ...(declared ? { accountName: declared } : {}),
      }));
      setMismatchAccepted(false);
    } catch (error) {
      setInquiry(null);
      setFailure(describeDisbursementError(error, "inquiry"));
    } finally {
      setBusy(null);
    }
  };

  /** Kiểm form + cổng tra tên, hỏi phí xem trước rồi sang bước xem lại. */
  const review = async () => {
    const form = parsed();
    if (!form.success) return collectErrors(form.error.issues);
    // Cổng tra tên chặn trước khi hỏi phí; điều kiện về xem trước kiểm lại sau khi có số liệu thật.
    const nameReason = nameGateReason(inquiry, mismatchAccepted);
    if (nameReason) {
      setFailure(nameReason);
      return;
    }
    setBusy("preview");
    setFailure(null);
    try {
      const data = await disbursementRequests.preview({ subId, amount: form.data.amount, bankCode: form.data.bankCode });
      setPreview(data);
      const reason = createBlockReason({ inquiry, mismatchAccepted, preview: data });
      if (reason) setFailure(reason);
      setStep("review");
    } catch (error) {
      setFailure(describeDisbursementError(error));
    } finally {
      setBusy(null);
    }
  };

  const otpBody = () => {
    const form = parsed();
    if (!form.success) return null;
    const { amount, bankCode, accountNumber, merchantRequestCode } = form.data;
    return { subId, merchantRequestCode, amount, bankCode, accountNumber };
  };

  /** Xin OTP gắn đúng lệnh vừa xem; gọi lại chính là "gửi lại mã" (cùng bộ giá trị). */
  const sendCode = async () => {
    const body = otpBody();
    if (!body || !preview || createBlockReason({ inquiry, mismatchAccepted, preview })) return;
    setBusy("otp");
    setFailure(null);
    try {
      setChallenge(await disbursementRequests.otpChallenge(body));
      setStep("otp");
    } catch (error) {
      setFailure(describeDisbursementError(error));
    } finally {
      setBusy(null);
    }
  };

  /** Gửi lệnh kèm OTP. Lỗi 4xx đưa người dùng về đúng bước sửa; lỗi chưa rõ kết quả giữ nguyên mã. */
  const confirm = async (otp: string) => {
    const form = parsed();
    if (!form.success || !challenge || sending.current) return;
    sending.current = true;
    setBusy("send");
    setFailure(null);
    // Ghi khoá TRƯỚC khi gửi: request có thể tới BE rồi trình duyệt bị reload/đóng trước khi có phản hồi. "Đang gửi" coi
    // như chưa rõ kết quả; chỉ xoá khi có kết quả xác định (xem catch).
    const wasUnconfirmed = outcomeUnknown;
    saveUnconfirmedOrder(storeKey, { values, inquiry, mismatchAccepted, savedAt: Date.now() });
    try {
      const view = await disbursementRequests.create({
        subId,
        merchantRequestCode: form.data.merchantRequestCode,
        amount: form.data.amount,
        bankCode: form.data.bankCode,
        accountNumber: form.data.accountNumber,
        ...(form.data.accountName ? { accountName: form.data.accountName } : {}),
        ...(form.data.description ? { description: form.data.description } : {}),
        nameMismatchAccepted: inquiry?.status === "NAME_MISMATCH" && mismatchAccepted,
        sensitiveOtp: { otpSessionId: challenge.otpSessionId, otp },
      });
      setOutcomeUnknown(false);
      clearUnconfirmedOrder(storeKey);
      setResult(view);
      setStep("result");
      await client.invalidateQueries({ queryKey: ["disbursements"] });
    } catch (error) {
      setFailure(describeDisbursementError(error, "create"));
      if (isOutcomeUnknown(error)) {
        // Lệnh có thể đã lưu: khoá mã/nội dung, ở lại bước OTP. OTP đã dùng nên phải xin mã mới rồi gửi lại cùng mã.
        setOutcomeUnknown(true);
      } else {
        // Lỗi 4xx xác định (OTP sai, từ chối, validation): lệnh chưa được tạo nên bỏ bản lưu vừa ghi. Nếu trước đó đã
        // chưa xác nhận (503 lần trước) thì GIỮ: OTP sai ở lần gửi lại không chứng minh lần đầu chưa tạo lệnh.
        if (!wasUnconfirmed) clearUnconfirmedOrder(storeKey);
        if (disbursementFailureKind(error) === "notEnabled") setStep("form");
      }
    } finally {
      sending.current = false;
      setBusy(null);
    }
  };

  /**
   * Sau khi chưa xác nhận được: tra lại lệnh theo mã. Có lệnh → sang kết quả. 404 "không có lệnh" chỉ cho biết lúc này
   * chưa thấy (yêu cầu tạo có thể còn đang chạy ở BE) nên VẪN giữ khoá mã YC + nội dung; muốn mã mới phải "Tạo lệnh khác".
   */
  const checkExisting = async () => {
    setBusy("lookup");
    setFailure(null);
    setLookedUp(true);
    try {
      const view = await disbursementRequests.find(subId, values.merchantRequestCode.trim());
      setOutcomeUnknown(false);
      clearUnconfirmedOrder(storeKey);
      setResult(view);
      setStep("result");
      await client.invalidateQueries({ queryKey: ["disbursements"] });
    } catch (error) {
      setFailure(isOrderNotFound(error)
        ? "Chưa có lệnh nào với mã yêu cầu này (có thể lệnh vẫn đang được xử lý). Mã yêu cầu và nội dung vẫn được khóa: bạn có thể gửi lại với cùng mã, hoặc tạo lệnh khác nếu chắc chắn."
        : describeDisbursementError(error, "create"));
    } finally {
      setBusy(null);
    }
  };

  /**
   * Người dùng chủ động bỏ lệnh chưa xác nhận để làm lệnh mới (mã YC mới, form trống). Chỉ cho phép sau khi đã thử tra
   * lại; UI phải cảnh báo lệnh cũ có thể đã được chi.
   */
  const abandonUnconfirmed = () => {
    if (!outcomeUnknown || !lookedUp) return;
    setValues({ merchantRequestCode: generateRequestCode(), bankCode: "", accountNumber: "", accountName: "", amount: "", description: "" });
    setErrors({});
    setInquiry(null);
    setMismatchAccepted(false);
    setPreview(null);
    setChallenge(null);
    setFailure(null);
    setOutcomeUnknown(false);
    setLookedUp(false);
    clearUnconfirmedOrder(storeKey);
    setStep("form");
  };

  const back = () => {
    setFailure(null);
    setStep(step === "otp" ? "review" : "form");
  };

  const blockReason = createBlockReason({ inquiry, mismatchAccepted, preview });

  return {
    step,
    values,
    errors,
    inquiry,
    mismatchAccepted,
    preview,
    challenge,
    result,
    failure,
    outcomeUnknown,
    canAbandon: outcomeUnknown && lookedUp,
    blockReason,
    isInquiring: busy === "inquiry",
    isPreviewing: busy === "preview",
    isRequestingCode: busy === "otp",
    isSending: busy === "send",
    isLookingUp: busy === "lookup",
    change,
    acceptMismatch: setMismatchAccepted,
    inquire,
    review,
    sendCode,
    confirm,
    checkExisting,
    abandonUnconfirmed,
    back,
  };
}

export type DisbursementCreateFlow = ReturnType<typeof useDisbursementCreateFlow>;
