import { useState, type FormEvent } from "react";
import { orderFormSchema, type OrderFormData } from "../schemas/order.schema";

export type OrderFormFields = {
  subMerchantId: string;
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
  };
}

export function useOrderForm(onSubmit: (values: OrderFormData) => Promise<void>) {
  const [values, setValues] = useState<OrderFormFields>(BLANK);
  const [errors, setErrors] = useState<OrderFormErrors>({});

  const change = <K extends keyof OrderFormFields>(field: K, value: OrderFormFields[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

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
    void onSubmit(parsed.data);
  };

  return { values, errors, change, submit };
}
