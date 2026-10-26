import { useCancelOrder, useCreateOrder, useRefreshOrderQr } from "./use-order-mutations";
import type { OrderDialogs } from "./use-order-dialogs";
import type { OrderFormData } from "../schemas/order.schema";

/** Coordinates the order mutations with the open dialog; errors stay visible inside the dialog. */
export function useOrderActions(dialogs: OrderDialogs) {
  const create = useCreateOrder();
  const refreshQr = useRefreshOrderQr();
  const cancel = useCancelOrder();

  const submitCreate = async (values: OrderFormData) => {
    try {
      const order = await create.create(values);
      dialogs.showCreated(order);
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

  const submitCancel = async () => {
    if (!dialogs.target) return;
    try {
      await cancel.cancel(dialogs.target.id);
      dialogs.close();
    } catch {
      // The dialog shows the server error and keeps the order open for a retry.
    }
  };

  const closeDialog = () => {
    create.reset();
    refreshQr.reset();
    cancel.reset();
    dialogs.close();
  };

  return { create, refreshQr, cancel, submitCreate, submitRefreshQr, submitCancel, closeDialog };
}
