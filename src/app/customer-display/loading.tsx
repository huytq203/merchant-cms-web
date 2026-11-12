/** Khung chờ cùng bố cục hai cột của màn hiển thị để không giật khi mã tải xong. */
export default function CustomerDisplayLoading() {
  return (
    <div className="grid min-h-dvh grid-cols-1 bg-background md:grid-cols-2" role="status" aria-label="Đang tải màn hiển thị">
      <div className="grid place-items-center">
        <div className="size-64 animate-pulse rounded-2xl bg-muted" />
      </div>
      <div className="bg-primary" />
    </div>
  );
}
