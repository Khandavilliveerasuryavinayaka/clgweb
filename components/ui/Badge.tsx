import React from 'react';
import { cn } from '@/lib/utils';
import { StatusType } from '@/types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: StatusType | 'PRESENT' | 'ABSENT' | 'OD' | 'ACTIVE' | 'BLOCKED' | 'CORE' | 'ELECTIVE' | 'LAB' | string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  dot = false,
  className,
  children,
  ...props
}) => {
  let computedVariant = variant || 'default';

  if (status) {
    const s = String(status).toUpperCase();
    if (['ACTIVE', 'APPROVED', 'PUBLISHED', 'COMPLETED', 'PRESENT', 'SUCCESS'].includes(s)) {
      computedVariant = 'success';
    } else if (['PENDING', 'DRAFT', 'SUBMITTED', 'PENDING REVIEW'].includes(s)) {
      computedVariant = 'warning';
    } else if (['REJECTED', 'BLOCKED', 'CANCELLED', 'ABSENT', 'FAILURE', 'RA'].includes(s)) {
      computedVariant = 'danger';
    } else if (['CORE', 'OD', 'INFO'].includes(s)) {
      computedVariant = 'info';
    } else if (['ELECTIVE', 'PURPLE'].includes(s)) {
      computedVariant = 'purple';
    } else {
      computedVariant = 'neutral';
    }
  }

  const variantClasses = {
    default: 'bg-brand-50 text-brand-700 border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const dotClasses = {
    default: 'bg-brand-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    purple: 'bg-purple-500',
    neutral: 'bg-slate-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors',
        variantClasses[computedVariant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', dotClasses[computedVariant])} />}
      {children || status}
    </span>
  );
};
