import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-full border border-[#e5e5e5] bg-white px-4.5 py-2.5 text-xs text-[#222222] shadow-[0_1px_2px_rgba(0,0,0,0.03)] placeholder:text-[#9e9e9e] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:border-[#004e9e] focus-visible:ring-4 focus-visible:ring-[#004e9e]/15 focus-visible:shadow-[0_0_18px_rgba(0,78,158,0.12)] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#fafafa]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };