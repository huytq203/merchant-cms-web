/** Development-only notice: the page is fed by static sample data, not by the BE. */
export function SampleDataBanner() {
  return (
    <div
      role="status"
      className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-2 text-sm text-foreground"
    >
      <strong className="font-semibold">Dữ liệu minh hoạ.</strong>{" "}
      Trang này đang dùng dữ liệu mẫu cho môi trường phát triển, không phải dữ liệu thật.
    </div>
  );
}
