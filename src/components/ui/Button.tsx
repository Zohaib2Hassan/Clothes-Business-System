import { type ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'white';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(
            "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:pointer-events-none",
            {
              'bg-brand-800 text-white hover:bg-brand-900': variant === 'primary',
              'bg-brand-50 text-brand-800 hover:bg-brand-100': variant === 'secondary',
              'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50': variant === 'outline',
              'text-gray-600 hover:bg-gray-100 hover:text-gray-900': variant === 'ghost',
              'bg-white text-gray-900 hover:bg-gray-100 shadow-sm': variant === 'white',
              'h-8 px-3 text-xs': size === 'sm',
              'h-10 px-4 text-sm': size === 'md',
              'h-12 px-6 text-base': size === 'lg',
            },
            className
          )
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
