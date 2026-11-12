import { notFound } from "next/navigation";
import { resolveModuleSource } from "@/lib/be/api-mode";
import { CustomerDisplayDemo } from "@/features/customer-display/components/CustomerDisplayDemo";
import { DEMO_STATES, type DemoState } from "@/features/customer-display/constants/demo-states";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Trang duyệt giao diện: chỉ tồn tại ở dev local khi `MERCHANT_API_MODE=fixture`; production và live trả 404. */
export default async function CustomerDisplayDemoPage({ searchParams }: Props) {
  if (resolveModuleSource("customer-display") !== "fixture") notFound();
  const requested = (await searchParams).state;
  const state = DEMO_STATES.find((item) => item === requested) ?? ("dynamic" satisfies DemoState);
  return <CustomerDisplayDemo state={state} now={new Date()} />;
}
