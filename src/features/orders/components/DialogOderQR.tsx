"use client";
import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/button/Button";
import { QRCode } from "@/components/ui/qrcode/QRCode";
import { CheckCircle2, Copy, Download, Mail } from "lucide-react";
import { toast } from "sonner";

interface DialogOderQRProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentUrl: string;
}

export function DialogOderQR({
  open,
  onOpenChange,
  paymentUrl,
}: DialogOderQRProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(paymentUrl);
    toast.success("Đã sao chép liên kết");
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "qr-thanh-toan.svg";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <DialogTitle>Tạo Link thành công!</DialogTitle>
          <DialogDescription>
            Gửi link hoặc mã QR này cho khách hàng để thanh toán
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2 ">
          <QRCode
            ref={qrRef}
            value={paymentUrl || "https://example.com"}
            size="lg"
            level="M"
            renderer="svg"
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
            <span className="flex-1 text-sm font-mono text-primary truncate min-w-0">
              {paymentUrl}
            </span>
            <Button
              size="sm"
              variant="glass-white"
              onClick={handleCopy}
              leftIcon={<Copy className="h-3.5 w-3.5" />}
            >
              Sao chép
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleDownloadQR}
            >
              Tải QR
            </Button>
            <Button
              leftIcon={<Mail className="h-4 w-4" />}
              onClick={() => toast.info("Tính năng gửi email đang phát triển")}
            >
              Gửi Email
            </Button>
          </div>
        </div>

        {/* <DialogFooter>
          <Button
            variant="outline"
            className="w-full mt-3"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}

export default DialogOderQR;
