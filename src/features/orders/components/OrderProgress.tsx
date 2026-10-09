import { StepProgress } from "@/components/page/StepProgress";
import type { OrderStatus } from "../schemas/order.schema";
import { ORDER_STEPS, orderStepStates } from "../utils/order-timeline";

export function OrderProgress({ status }: { status: OrderStatus }) {
  return <StepProgress label="Tiến trình đơn hàng" steps={ORDER_STEPS} states={orderStepStates(status)} />;
}
