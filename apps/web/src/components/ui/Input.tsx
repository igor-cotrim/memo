import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const inputClasses =
  'bg-bg-input border border-border rounded-sm px-4 py-3 text-text-primary font-body text-[0.9375rem] transition shadow-none focus:outline-none focus:border-accent-primary focus:ring-0 w-full';

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`${inputClasses} ${error ? 'border-accent-danger' : ''} ${className ?? ''}`}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input, type InputProps };
