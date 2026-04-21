'use client';
import { Button, Skeleton } from '@/components/ui';
import * as Card from '@/components/ui/card/Card';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Mail,
  User,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { Merchant } from '../types';
import { ApproveMerchantDialog } from './ApproveMerchantDialog';
import { LockMerchantDialog } from './LockMerchantDialog';
import { RejectMerchantDialog } from './RejectMerchantDialog';
import Link from 'next/link';
import { MERCHANT_STATUS_OPTIONS, MERCHANT_TYPE_OPTIONS } from '../constants/Merchant.constants';
import { Badge } from '@/components/ui/badge/Badge';

interface MerchantDetailProps {
  merchant: Merchant;
}

function InfoRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className="py-3 grid grid-cols-5 gap-2 border-b border-border/50 last:border-0">
      <dt className="col-span-2 text-sm text-muted-foreground font-medium">{label}</dt>
      <dd className={cn('col-span-3 text-sm text-foreground', className)}>
        {value ?? <span className="italic text-muted-foreground">Chưa cung cấp</span>}
      </dd>
    </div>
  );
}

function DocPreview({ url, label }: { url: string | null; label: string }) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-border bg-muted/30">
        <AlertCircle className="h-6 w-6 text-muted-foreground/50 mb-1" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    );
  }
  return (
    <div className="relative group h-32 rounded-lg border border-border overflow-hidden bg-muted/20">
      <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
        {label}
      </div>
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-white text-xs font-medium">Xem ảnh</span>
      </div>
    </div>
  );
}

function getMissingFields(merchant: Merchant): string[] {
  const missing: string[] = [];
  if (!merchant.name) missing.push('Tên merchant');
  if (!merchant.merchantType) missing.push('Loại merchant');
  if (!merchant.businessType) missing.push('Lĩnh vực kinh doanh');
  if (!merchant.phone) missing.push('Số điện thoại');
  if (merchant.merchantType !== 'individual' && !merchant.taxCode) missing.push('Mã số thuế');
  if (!merchant.representativeName) missing.push('Người đại diện');
  if (!merchant.representativeCccd) missing.push('Số CCCD');
  if (!merchant.address) missing.push('Địa chỉ trụ sở');
  if (!merchant.documents.cccdFront || !merchant.documents.cccdBack) missing.push('Ảnh CCCD (2 mặt)');
  if (merchant.merchantType !== 'individual' && !merchant.documents.businessLicense)
    missing.push('Đăng ký kinh doanh');
  if (!merchant.documents.contract) missing.push('Hợp đồng');
  return missing;
}

export function MerchantDetail({ merchant }: MerchantDetailProps) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);

  const missingFields = getMissingFields(merchant);
  const isComplete = missingFields.length === 0;
  const canApprove = isComplete && merchant.status === 'pending';
  const isLocked = merchant.status === 'locked';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/merchants"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">
                {merchant.name ?? merchant.email}
              </h1>
              <Badge variant={MERCHANT_STATUS_OPTIONS.find((x) => x.value === merchant.status)?.variant || 'text-danger'}>
                {MERCHANT_STATUS_OPTIONS.find((x) => x.value === merchant.status)?.label || merchant.status}
              </Badge>
              {merchant.merchantType && <Badge variant={MERCHANT_TYPE_OPTIONS.find((x) => x.value === merchant.merchantType)?.variant || 'text-danger'}>
                {MERCHANT_TYPE_OPTIONS.find((x) => x.value === merchant.merchantType)?.label || merchant.merchantType}
              </Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{merchant.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {merchant.status === 'incomplete' && (
            <Button variant="outline" size="sm" leftIcon={<Mail className="h-4 w-4" />}>
              Gửi nhắc nhở
            </Button>
          )}
          {(merchant.status === 'pending' || merchant.status === 'incomplete') && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setRejectOpen(true)}
                leftIcon={<XCircle className="h-4 w-4" />}
              >
                Từ chối
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!canApprove}
                onClick={() => setApproveOpen(true)}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                Phê duyệt
              </Button>
            </>
          )}
          {(merchant.status === 'active' || merchant.status === 'locked') && (
            <Button
              size="sm"
              className={isLocked ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
              onClick={() => setLockOpen(true)}
            >
              {isLocked ? 'Mở khóa' : 'Khóa ví'}
            </Button>
          )}
          <Link href={`/merchants/${merchant.id}/edit`}>
            <Button variant="outline" size="sm">
              Chỉnh sửa
            </Button>
          </Link>
        </div>
      </div>

      {/* Missing fields banner */}
      {missingFields.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Hồ sơ chưa đầy đủ — còn {missingFields.length} thông tin cần bổ sung:
              </p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {missingFields.map((f) => (
                  <li
                    key={f}
                    className="text-xs bg-red-100 text-red-700 rounded px-2 py-0.5 border border-red-200"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic info */}
        <Card.Card>
          <Card.CardHeader>
            <Card.CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Thông tin tài khoản
            </Card.CardTitle>
          </Card.CardHeader>
          <Card.CardContent className="pt-0">
            <dl>
              <InfoRow label="Email đăng ký" value={merchant.email} />
              <InfoRow label="Tên merchant" value={merchant.name} />
              <InfoRow
                label="Loại merchant"
                value={
                  merchant.merchantType && (
                    <Badge variant={MERCHANT_TYPE_OPTIONS.find((x) => x.value === merchant.merchantType)?.variant || 'text-danger'}>
                      {MERCHANT_TYPE_OPTIONS.find((x) => x.value === merchant.merchantType)?.label || merchant.merchantType}
                    </Badge>
                  )
                }
              />
              <InfoRow
                label="Lĩnh vực kinh doanh"
                value={merchant.businessTypeName}
              />
              <InfoRow
                label="Số điện thoại"
                value={merchant.phone}
              />
              {merchant.merchantType !== 'individual' && (
                <InfoRow label="Mã số thuế" value={merchant.taxCode} />
              )}
              <InfoRow label="Địa chỉ trụ sở" value={merchant.address} />
            </dl>
          </Card.CardContent>
        </Card.Card>

        {/* Representative */}
        <Card.Card>
          <Card.CardHeader>
            <Card.CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-muted-foreground" />
              Người đại diện
            </Card.CardTitle>
          </Card.CardHeader>
          <Card.CardContent className="pt-0">
            <dl>
              <InfoRow label="Họ và tên" value={merchant.representativeName} />
              <InfoRow label="Chức vụ" value={merchant.representativePosition} />
              <InfoRow label="Số CCCD" value={merchant.representativeCccd} />
              <InfoRow
                label="Ngày hết hạn CCCD"
                value={
                  merchant.representativeCccdExpiry
                    ? format(new Date(merchant.representativeCccdExpiry), 'dd/MM/yyyy')
                    : null
                }
              />
              <InfoRow
                label="SĐT nhận OTP"
                value={merchant.representativeOtpPhone}
              />
            </dl>
          </Card.CardContent>
        </Card.Card>

        {/* Financial */}
        <Card.Card>
          <Card.CardHeader>
            <Card.CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Thông tin tài chính
            </Card.CardTitle>
          </Card.CardHeader>
          <Card.CardContent className="pt-0">
            <dl>
              <InfoRow
                label="Email đối soát"
                value={merchant.emailReconciliation}
              />
              <InfoRow
                label="Email hóa đơn"
                value={merchant.emailInvoice}
              />
              <InfoRow
                label="Số dư ví"
                value={
                  <span
                    className={cn(
                      'font-mono font-semibold',
                      merchant.walletBalance > 0
                        ? 'text-emerald-600'
                        : merchant.walletBalance < 0
                          ? 'text-red-600'
                          : 'text-foreground'
                    )}
                  >
                    {new Intl.NumberFormat('vi-VN').format(merchant.walletBalance)} vnđ
                  </span>
                }
              />
              <InfoRow
                label="Sales phụ trách"
                value={
                  merchant.salesStaffName ?? (
                    <span className="italic text-red-400">Chưa gán</span>
                  )
                }
              />
              <InfoRow
                label="Ngày đăng ký"
                value={
                  merchant.registeredAt
                    ? format(new Date(merchant.registeredAt), 'dd/MM/yyyy HH:mm')
                    : null
                }
              />
              <InfoRow
                label="Ngày kích hoạt"
                value={
                  merchant.activatedAt
                    ? format(new Date(merchant.activatedAt), 'dd/MM/yyyy HH:mm')
                    : <span className="italic text-muted-foreground">Chưa kích hoạt</span>
                }
              />
            </dl>
          </Card.CardContent>
        </Card.Card>

        {/* Documents */}
        <Card.Card>
          <Card.CardHeader>
            <Card.CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              Hồ sơ pháp lý
            </Card.CardTitle>
          </Card.CardHeader>
          <Card.CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              <DocPreview url={merchant.documents.cccdFront} label="CCCD mặt trước" />
              <DocPreview url={merchant.documents.cccdBack} label="CCCD mặt sau" />
              {merchant.merchantType !== 'individual' && (
                <DocPreview
                  url={merchant.documents.businessLicense}
                  label="Đăng ký kinh doanh"
                />
              )}
              <DocPreview url={merchant.documents.contract} label="Hợp đồng" />
            </div>
          </Card.CardContent>
        </Card.Card>
      </div>

      {/* Dialogs */}
      <ApproveMerchantDialog
        merchant={merchant}
        open={approveOpen}
        onOpenChange={setApproveOpen}
      />
      <RejectMerchantDialog
        merchant={merchant}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
      />
      {(merchant.status === 'active' || merchant.status === 'locked') && (
        <LockMerchantDialog
          merchant={merchant}
          action={isLocked ? 'unlock' : 'lock'}
          open={lockOpen}
          onOpenChange={setLockOpen}
        />
      )}
    </div>
  );
}

export function MerchantDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
