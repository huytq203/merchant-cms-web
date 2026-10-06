import { useCreateOrder, useRefreshOrderQr } from "./use-order-mutations";
import type { OrderDialogs } from "./use-order-dialogs";
import type { OrderFormData } from "../schemas/order.schema";

/** Coordinates the order mutations with the open dialog; errors stay visible inside the dialog. */
export function useOrderActions(dialogs: OrderDialogs) {
  const create = useCreateOrder();
  const refreshQr = useRefreshOrderQr();

  const submitCreate = async (values: OrderFormData) => {
    try {
      const order = await create.create(values);
      dialogs.openFor("qr", order);
    } catch {
      // The form stays open with the server error.
    }
  };

  const submitRefreshQr = async () => {
    if (!dialogs.target) return;
    try {
      await refreshQr.refresh(dialogs.target.id);
    } catch {
      // The dialog shows the server error.
    }
  };

  const closeDialog = () => {
    create.reset();
    refreshQr.reset();
    dialogs.close();
  };

  return { create, refreshQr, submitCreate, submitRefreshQr, closeDialog };
}
