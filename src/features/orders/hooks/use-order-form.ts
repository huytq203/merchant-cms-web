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

export function useOrderForm(onSubmit: (values: OrderFormData) => Promise<void>) {
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
    const parsed = orderFormSchema.safeParse(toSchemaInput(values));
    if (!parsed.success) {
      const next: OrderFormErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !(field in next)) next[field as keyof OrderFormFields] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    writeLastBank(parsed.data.bankCode);
    void onSubmit(parsed.data);
  };

  return { values, errors, change, generateCode, submit };
}
