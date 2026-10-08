import type { ReactNode } from 'react';
import { Copy, Link } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip/Tooltip';
import { cn } from '@/lib/utils/cn';

export interface MonogramProps { initials: string; bgClassName?: string; }

export function Monogram({ initials, bgClassName = 'bg-primary' }: MonogramProps) {
  return <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white', bgClassName)} aria-hidden="true">{initials.slice(0, 2).toUpperCase()}</div>;
}

export interface StatusBadgeProps { children: ReactNode; tone?: 'success' | 'danger' | 'warning' | 'info' | 'neutral'; }

export function StatusBadge({ children, tone = 'success' }: StatusBadgeProps) {
  const tones = { success: 'bg-success-soft text-success', danger: 'bg-danger-soft text-danger', warning: 'bg-warning-soft text-warning', info: 'bg-info-soft text-info', neutral: 'bg-muted text-muted-foreground' };
  return <span className={cn('inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold', tones[tone])}>{children}</span>;
}

export interface BadgeProps { children: ReactNode; tone?: 'action' | 'info' | 'success'; }

export function Badge({ children, tone = 'action' }: BadgeProps) {
  const tones = { action: 'bg-action text-[#3D3000]', info: 'bg-info-soft text-info', success: 'bg-success-soft text-success' };
  return <span className={cn('inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold', tones[tone])}>{children}</span>;
}

export interface DetailHeaderProps { monogramInitials: string; title: string; code?: string; statusBadge?: ReactNode; secondaryBadge?: ReactNode; monogramBgClassName?: string; }

function CopyCodeButton({ code }: { code: string }) {
  const handleCopy = () => navigator.clipboard.writeText(code).catch(() => undefined);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1 text-sm font-medium text-brand-ink hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand"
            aria-label={`Sao chép mã ${code}`}
          >
            <code className="font-mono text-xs">{code}</code>
            <Copy className="h-4 w-4" />
          </button>
        }
      />
      <TooltipContent>Sao chép mã</TooltipContent>
    </Tooltip>
  );
}

/** The code chip is omitted when the entity has no code. */
export function DetailHeader({ monogramInitials, title, code, statusBadge, secondaryBadge, monogramBgClassName }: DetailHeaderProps) {
  return (
    <div className="flex items-start gap-4 bg-muted px-6 py-5">
      <Monogram initials={monogramInitials} bgClassName={monogramBgClassName} />
      <div className="min-w-0 flex-1">
        <h2 className="mb-2 text-xl font-bold leading-tight text-foreground">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {code ? <CopyCodeButton code={code} /> : null}
          {statusBadge ? <div>{statusBadge}</div> : null}
          {secondaryBadge ? <div>{secondaryBadge}</div> : null}
        </div>
      </div>
    </div>
  );
}

export interface InheritedHintProps { title?: string; }

export function InheritedHint({ title = 'Giá trị lấy từ Master. Sửa ở Master để đổi.' }: InheritedHintProps) {
  return <span className="inline-flex cursor-help items-center gap-1 text-xs font-medium text-info" title={title}><Link className="h-3 w-3" />Từ Master</span>;
}
