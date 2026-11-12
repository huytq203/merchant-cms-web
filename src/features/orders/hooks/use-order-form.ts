import { useState, type FormEvent } from "react";
import { orderFormSchema, type OrderFormData } from "../schemas/order.schema";
import { generateOrderCode } from "../utils/order-code";
import { readLastBank, writeLastBank } from "../utils/order-preferences";

export type OrderFormFields = {
  subMerchantId: string;
  terminalId: string;
  bankCode: string;
  orderCode: string;
  amount: string;
  paymentMethod: string;
  expiryMinutes: string;
  orderDescription: string;
};

const SUB_REQUIRED = "Chọn Sub-merchant nhận tiền";

export type OrderFormErrors = Partial<Record<keyof OrderFormFields, string>>;

const BLANK: OrderFormFields = {
  subMerchantId: "",
  terminalId: "",
  bankCode: "",
  orderCode: "",
  amount: "",
  paymentMethod: "QR",
  expiryMinutes: "0",
  orderDescription: "",
};

function toSchemaInput(values: OrderFormFields) {
  return {
    orderCode: values.orderCode,
    orderDescription: values.orderDescription,
    amount: values.amount,
    bankCode: values.bankCode || undefined,
    paymentMethod: values.paymentMethod,
    expiryMinutes: values.expiryMinutes,
    ...(values.subMerchantId ? { subMerchantId: values.subMerchantId } : {}),
    ...(values.terminalId ? { terminalId: values.terminalId } : {}),
  };
}

/**
 * @param fallbackSubMerchantId Sub shown as chosen when the user has not picked one (the only Sub in
 *   scope, or the default one). It is sent with the order so the Terminal list and the order always
 *   refer to the same Sub; empty means no Sub can be assumed and the user must pick one.
 */
export function useOrderForm(onSubmit: (values: OrderFormData) => Promise<void>, fallbackSubMerchantId = "") {
  const [values, setValues] = useState<OrderFormFields>(() => ({ ...BLANK, bankCode: readLastBank() }));
  const [errors, setErrors] = useState<OrderFormErrors>({});

  const change = <K extends keyof OrderFormFields>(field: K, value: OrderFormFields[K]) => {
    // A Terminal belongs to one Sub-merchant, so switching the Sub-merchant drops the chosen Terminal.
    setValues((current) => ({ ...current, [field]: value, ...(field === "subMerchantId" ? { terminalId: "" } : {}) }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const generateCode = () => change("orderCode", generateOrderCode());

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const subMerchantId = values.subMerchantId || fallbackSubMerchantId;
    const parsed = orderFormSchema.safeParse(toSchemaInput({ ...values, subMerchantId }));
    if (!parsed.success) {
      const next: OrderFormErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !(field in next)) next[field as keyof OrderFormFields] = issue.message;
      }
      if (!subMerchantId && !next.subMerchantId) next.subMerchantId = SUB_REQUIRED;
      setErrors(next);
      return;
    }
    // Every order needs a known Sub first: it decides where the money goes and which Terminals fit.
    if (!subMerchantId) {
      setErrors({ subMerchantId: SUB_REQUIRED });
      return;
    }
    setErrors({});
    writeLastBank(parsed.data.bankCode);
    void onSubmit(parsed.data);
  };

  return { values, errors, change, generateCode, submit };
}
