import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004e9e]/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-[#004e9e] text-white hover:bg-[#003b78] active:bg-[#002d5c] hover:shadow-[0_4px_20px_-2px_rgba(0,78,158,0.35)] shadow-[0_2px_8px_-1px_rgba(0,78,158,0.15)]',
        primary: 'bg-[#004e9e] text-white hover:bg-[#003b78] active:bg-[#002d5c] hover:shadow-[0_4px_20px_-2px_rgba(0,78,158,0.35)] shadow-[0_2px_8px_-1px_rgba(0,78,158,0.15)]',
        secondary: 'bg-white border border-[#e5e5e5] text-[#004e9e] hover:bg-[#fafafa] hover:border-[#bfdbfe] hover:shadow-[0_4px_16px_-4px_rgba(0,78,158,0.12)] shadow-[0_1px_3px_rgba(0,0,0,0.03)]',
        accent: 'bg-[#f8af43] text-[#222222] font-bold hover:bg-[#e59d30] hover:shadow-[0_4px_20px_-2px_rgba(248,175,67,0.4)] shadow-[0_2px_8px_-1px_rgba(248,175,67,0.2)]',
        gold: 'bg-[#f8af43] text-[#222222] font-bold hover:bg-[#e59d30] hover:shadow-[0_4px_20px_-2px_rgba(248,175,67,0.4)] shadow-[0_2px_8px_-1px_rgba(248,175,67,0.2)]',
        success: 'bg-[#10b981] text-white hover:bg-[#059669] active:bg-[#047857] hover:shadow-[0_4px_20px_-2px_rgba(16,185,129,0.35)] shadow-[0_2px_8px_-1px_rgba(16,185,129,0.15)]',
        destructive: 'bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] hover:bg-[#fee2e2] hover:shadow-[0_4px_16px_-4px_rgba(185,28,28,0.15)]',
        outline: 'border border-[#e5e5e5] bg-white text-[#222222] hover:bg-[#fafafa] hover:border-[#d4d4d4] hover:shadow-[0_2px_10px_-2px_rgba(0,0,0,0.06)] shadow-[0_1px_3px_rgba(0,0,0,0.03)]',
        ghost: 'text-[#616161] hover:text-[#004e9e] hover:bg-[#e6eff8] shadow-none',
        link: 'text-[#004e9e] underline-offset-4 hover:underline p-0 h-auto font-medium shadow-none',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3.5 text-[11px]',
        lg: 'h-12 px-7 text-sm font-bold',
        icon: 'h-9 w-9 p-0 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };