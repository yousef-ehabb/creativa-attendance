import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-normal transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#004e9e]/20 select-none',
  {
    variants: {
      variant: {
        default: 'border border-[#004e9e] bg-[#004e9e] text-white shadow-[0_2px_8px_-1px_rgba(0,78,158,0.3)]',
        primary: 'border border-[#bfdbfe] bg-[#e6eff8] text-[#004e9e] shadow-[0_0_12px_-2px_rgba(0,78,158,0.2)]',
        blue: 'border border-[#bfdbfe] bg-[#e6eff8] text-[#004e9e] shadow-[0_0_12px_-2px_rgba(0,78,158,0.2)]',
        gold: 'border border-[#fde68a] bg-[#fef3e2] text-[#b45309] shadow-[0_0_12px_-2px_rgba(248,175,67,0.25)]',
        success: 'border border-[#a7f3d0] bg-[#ecfdf5] text-[#047857] shadow-[0_0_12px_-2px_rgba(16,185,129,0.25)]',
        warning: 'border border-[#fde68a] bg-[#fffbeb] text-[#b45309]',
        destructive: 'border border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
        secondary: 'border border-[#e5e5e5] bg-[#fafafa] text-[#616161]',
        outline: 'border border-[#e5e5e5] bg-white text-[#616161] shadow-[0_1px_2px_rgba(0,0,0,0.03)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };